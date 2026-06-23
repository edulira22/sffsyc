"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import type { EstatusBeneficiario, EstatusInscripcion } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import {
  beneficiarioSchema,
  aplicaGradoEscuela,
  type BeneficiarioInput,
} from "@/lib/schemas/beneficiario"
import { inscripcionSchema, type InscripcionInput } from "@/lib/schemas/inscripcion"
import { buscarDuplicados, type ParamsDuplicado } from "@/lib/data/beneficiarios"

type ResultadoCrear = { ok: true; id: number } | { ok: false; error: string }

// Búsqueda de duplicados expuesta como acción para el flujo de registro.
export async function accionBuscarDuplicados(params: ParamsDuplicado) {
  await requerirSesion()
  const resultados = await buscarDuplicados(params)
  return resultados.map((b) => ({
    id: b.id,
    nombre: `${b.nombres} ${b.apellidoPaterno} ${b.apellidoMaterno ?? ""}`.trim(),
    curp: b.curp,
    fechaNacimiento: b.fechaNacimiento.toISOString().slice(0, 10),
    estatus: b.estatus,
  }))
}

function datosBeneficiario(d: BeneficiarioInput) {
  const aplica = aplicaGradoEscuela(d.escolaridad ?? undefined)
  return {
    apellidoPaterno: d.apellidoPaterno,
    apellidoMaterno: d.apellidoMaterno || null,
    nombres: d.nombres,
    fechaNacimiento: new Date(d.fechaNacimiento),
    curp: d.curp ? d.curp.toUpperCase() : null,
    sinCurp: d.sinCurp ?? false,
    telefono: d.telefono || null,
    domicilio: d.domicilio || null,
    escolaridad: d.escolaridad ?? null,
    gradoEscolar: aplica ? d.gradoEscolar || null : null,
    nombreEscuela: aplica ? d.nombreEscuela || null : null,
    observaciones: d.observaciones || null,
  }
}

export async function crearBeneficiario(
  input: BeneficiarioInput
): Promise<ResultadoCrear> {
  await requerirSesion()

  const parsed = beneficiarioSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const beneficiario = await prisma.beneficiario.create({
      data: datosBeneficiario(parsed.data),
    })
    revalidatePath("/beneficiarios")
    return { ok: true, id: beneficiario.id }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un beneficiario con esta CURP." }
    }
    throw e
  }
}

export async function editarBeneficiario(
  id: number,
  input: BeneficiarioInput
): Promise<ResultadoAccion> {
  await requerirSesion()

  const parsed = beneficiarioSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }

  try {
    await prisma.beneficiario.update({
      where: { id },
      data: datosBeneficiario(parsed.data),
    })
    revalidatePath("/beneficiarios")
    revalidatePath(`/beneficiarios/${id}`)
    return exito("Cambios guardados")
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fallo("Ya existe un beneficiario con esta CURP.")
    }
    throw e
  }
}

export async function cambiarEstatusBeneficiario(
  id: number,
  estatus: EstatusBeneficiario
): Promise<ResultadoAccion> {
  await requerirSesion()
  await prisma.beneficiario.update({ where: { id }, data: { estatus } })
  revalidatePath("/beneficiarios")
  revalidatePath(`/beneficiarios/${id}`)
  const labels: Record<EstatusBeneficiario, string> = {
    activo: "Beneficiario activado",
    inactivo: "Beneficiario marcado como inactivo",
    baja: "Beneficiario dado de baja",
  }
  return exito(labels[estatus])
}

// --- Inscripciones ----------------------------------------------------------

export async function crearInscripcion(
  beneficiarioId: number,
  input: InscripcionInput
): Promise<ResultadoAccion> {
  const session = await requerirSesion()

  const parsed = inscripcionSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }
  const d = parsed.data

  const claseCentro = await prisma.claseCentro.findUnique({
    where: { id: d.claseCentroId },
    include: { centro: true, clase: true },
  })
  if (!claseCentro) return fallo("La clase seleccionada no existe.")

  // La coordinadora de zona solo inscribe en centros de su zona.
  if (
    session.user.rol === "coordinadora_zona" &&
    claseCentro.centro.zonaId !== session.user.zonaId
  ) {
    return fallo("No puedes inscribir en centros fuera de tu zona.")
  }

  // No permitir doble inscripción activa en la misma clase del mismo centro.
  const existente = await prisma.inscripcion.findFirst({
    where: {
      beneficiarioId,
      claseCentroId: d.claseCentroId,
      estatus: "activa",
    },
  })
  if (existente) {
    return fallo(
      `Este beneficiario ya está inscrito en "${claseCentro.clase.nombreOficial}" en ${claseCentro.centro.nombre}.`
    )
  }

  await prisma.inscripcion.create({
    data: {
      beneficiarioId,
      claseCentroId: d.claseCentroId,
      fechaInscripcion: new Date(d.fechaInscripcion),
      observaciones: d.observaciones || null,
    },
  })

  revalidatePath(`/beneficiarios/${beneficiarioId}`)
  return exito("Inscripción registrada")
}

export async function cambiarEstatusInscripcion(
  id: number,
  beneficiarioId: number,
  estatus: EstatusInscripcion
): Promise<ResultadoAccion> {
  await requerirSesion()
  await prisma.inscripcion.update({ where: { id }, data: { estatus } })
  revalidatePath(`/beneficiarios/${beneficiarioId}`)
  return exito(
    estatus === "activa" ? "Inscripción reactivada" : "Inscripción dada de baja"
  )
}
