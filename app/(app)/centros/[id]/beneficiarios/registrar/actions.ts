"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { aplicaGradoEscuela, ESCOLARIDADES } from "@/lib/schemas/beneficiario"

// ---- Schema para una fila del registrador masivo ----------------------------

const filaSchema = z.object({
  apellidoPaterno: z.string().trim().min(1, "Apellido paterno requerido"),
  apellidoMaterno: z.string().trim().optional().or(z.literal("")),
  nombres: z.string().trim().min(1, "Nombre requerido"),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  curp: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z0-9]{18}$/.test(v), {
      message: "CURP inválida",
    })
    .optional()
    .or(z.literal("")),
  sinCurp: z.boolean().default(false),
  telefono: z.string().trim().optional().or(z.literal("")),
  sinTelefono: z.boolean().default(false),
  domicilio: z.string().trim().optional().or(z.literal("")),
  sinDomicilio: z.boolean().default(false),
  escolaridad: z.enum(ESCOLARIDADES).optional().nullable(),
  gradoEscolar: z.string().trim().optional().or(z.literal("")),
  nombreEscuela: z.string().trim().optional().or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
  clasesCentroIds: z.array(z.number()).min(1, "Selecciona al menos una clase"),
})

export type FilaBatch = z.infer<typeof filaSchema>

export type ResultadoFila = {
  index: number
  tipo: "nuevo" | "reingreso" | "ya_inscrito" | "error"
  nombre: string
  detalle?: string
}

// ---- Verificar CURP ---------------------------------------------------------

export async function verificarCurp(curp: string): Promise<{
  existe: boolean
  beneficiario?: { id: number; nombre: string; fechaNacimiento: string }
}> {
  await requerirSesion()
  const limpia = curp.trim().toUpperCase()
  if (!limpia || !/^[A-Z0-9]{18}$/.test(limpia)) return { existe: false }

  const b = await prisma.beneficiario.findUnique({
    where: { curp: limpia },
    select: {
      id: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      fechaNacimiento: true,
    },
  })
  if (!b) return { existe: false }

  return {
    existe: true,
    beneficiario: {
      id: b.id,
      nombre: `${b.nombres} ${b.apellidoPaterno} ${b.apellidoMaterno ?? ""}`.trim(),
      fechaNacimiento: b.fechaNacimiento.toISOString().slice(0, 10),
    },
  }
}

// ---- Registro masivo --------------------------------------------------------

function construirObservaciones(
  obs: string | null | undefined,
  sinTelefono: boolean,
  sinDomicilio: boolean
): string | null {
  const notas: string[] = []
  if (sinTelefono) notas.push("No proporcionó teléfono")
  if (sinDomicilio) notas.push("No proporcionó domicilio")
  if (obs) notas.push(obs)
  return notas.length > 0 ? notas.join(". ") : null
}

export async function registrarMasivo(
  centroId: number,
  filas: FilaBatch[],
  periodoFecha?: string
): Promise<{ ok: boolean; resultados: ResultadoFila[] }> {
  const session = await requerirSesion()

  const centro = await prisma.centro.findUnique({
    where: { id: centroId },
    select: { id: true, zonaId: true },
  })
  if (!centro) return { ok: false, resultados: [] }

  if (
    session.user.rol === "coordinadora_zona" &&
    centro.zonaId !== session.user.zonaId
  ) {
    return { ok: false, resultados: [] }
  }

  const resultados: ResultadoFila[] = []

  for (let i = 0; i < filas.length; i++) {
    const parsed = filaSchema.safeParse(filas[i])
    if (!parsed.success) {
      resultados.push({
        index: i,
        tipo: "error",
        nombre: `Fila ${i + 1}`,
        detalle: parsed.error.issues[0]?.message ?? "Datos inválidos",
      })
      continue
    }

    const d = parsed.data
    const nombreCompleto = `${d.nombres} ${d.apellidoPaterno} ${d.apellidoMaterno ?? ""}`.trim()
    const aplica = aplicaGradoEscuela(d.escolaridad ?? undefined)

    try {
      // ¿Existe ya en el sistema por CURP?
      let beneficiarioId: number | null = null
      let esNuevo = false

      if (d.curp && !d.sinCurp) {
        const existente = await prisma.beneficiario.findUnique({
          where: { curp: d.curp.toUpperCase() },
          select: { id: true },
        })
        if (existente) beneficiarioId = existente.id
      }

      if (beneficiarioId === null) {
        const nuevo = await prisma.beneficiario.create({
          data: {
            apellidoPaterno: d.apellidoPaterno,
            apellidoMaterno: d.apellidoMaterno || null,
            nombres: d.nombres,
            fechaNacimiento: new Date(d.fechaNacimiento),
            curp: d.curp && !d.sinCurp ? d.curp.toUpperCase() : null,
            sinCurp: d.sinCurp,
            telefono: !d.sinTelefono ? d.telefono || null : null,
            domicilio: !d.sinDomicilio ? d.domicilio || null : null,
            escolaridad: d.escolaridad ?? null,
            gradoEscolar: aplica ? d.gradoEscolar || null : null,
            nombreEscuela: aplica ? d.nombreEscuela || null : null,
            observaciones: construirObservaciones(d.observaciones, d.sinTelefono, d.sinDomicilio),
          },
        })
        beneficiarioId = nuevo.id
        esNuevo = true
      }

      // Inscribir en cada clase solicitada.
      const fechaInsc = periodoFecha ? new Date(periodoFecha) : new Date()
      let yaInscritos = 0
      for (const claseId of d.clasesCentroIds) {
        const whereYa = periodoFecha
          ? { beneficiarioId: beneficiarioId!, claseCentroId: claseId, fechaInscripcion: fechaInsc }
          : { beneficiarioId: beneficiarioId!, claseCentroId: claseId, estatus: "activa" as const }
        const yaActiva = await prisma.inscripcion.findFirst({ where: whereYa })
        if (yaActiva) { yaInscritos++; continue }
        await prisma.inscripcion.create({
          data: { beneficiarioId: beneficiarioId!, claseCentroId: claseId, fechaInscripcion: fechaInsc },
        })
      }

      if (yaInscritos === d.clasesCentroIds.length) {
        resultados.push({
          index: i,
          tipo: "ya_inscrito",
          nombre: nombreCompleto,
          detalle: "Ya estaba registrado en este periodo",
        })
      } else if (esNuevo) {
        resultados.push({ index: i, tipo: "nuevo", nombre: nombreCompleto })
      } else {
        resultados.push({ index: i, tipo: "reingreso", nombre: nombreCompleto })
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        resultados.push({
          index: i,
          tipo: "error",
          nombre: nombreCompleto,
          detalle: "CURP duplicada — ya existe otro registro con esta CURP.",
        })
      } else {
        throw e
      }
    }
  }

  revalidatePath(`/centros/${centroId}`)
  revalidatePath("/beneficiarios")

  return { ok: true, resultados }
}
