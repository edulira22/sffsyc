"use server"

import { revalidatePath } from "next/cache"
import type { EstatusCentro } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requerirRol } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { centroSchema, type CentroInput } from "@/lib/schemas/centro"
import {
  asignarClaseSchema,
  type AsignarClaseInput,
} from "@/lib/schemas/clase-centro"

const ROLES_EDICION = ["admin", "coordinacion_general", "coordinadora_zona"] as const

type ResultadoCrear = { ok: true; id: number } | { ok: false; error: string }

function datosCentro(d: CentroInput, zonaId: number) {
  return {
    nombre: d.nombre,
    tipo: d.tipo,
    zonaId,
    coordinadoraId: d.coordinadoraId ?? null,
    estatus: d.estatus,
    direccion: d.direccion || null,
    referenciaUbicacion: d.referenciaUbicacion || null,
    horarioGeneral: d.horarioGeneral || null,
    observaciones: d.observaciones || null,
  }
}

export async function crearCentro(input: CentroInput): Promise<ResultadoCrear> {
  const session = await requerirRol([...ROLES_EDICION])

  const parsed = centroSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const d = parsed.data

  // La coordinadora de zona solo puede crear centros en SU zona.
  let zonaId = d.zonaId
  if (session.user.rol === "coordinadora_zona") {
    if (!session.user.zonaId)
      return { ok: false, error: "Tu usuario no tiene una zona asignada." }
    zonaId = session.user.zonaId
  }

  const centro = await prisma.centro.create({ data: datosCentro(d, zonaId) })

  revalidatePath("/centros")
  return { ok: true, id: centro.id }
}

export async function editarCentro(
  id: number,
  input: CentroInput
): Promise<ResultadoAccion> {
  const session = await requerirRol([...ROLES_EDICION])

  const parsed = centroSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }
  const d = parsed.data

  const existente = await prisma.centro.findUnique({ where: { id } })
  if (!existente) return fallo("El centro no existe.")

  let zonaId = d.zonaId
  if (session.user.rol === "coordinadora_zona") {
    if (existente.zonaId !== session.user.zonaId)
      return fallo("No puedes editar centros fuera de tu zona.")
    zonaId = session.user.zonaId
  }

  await prisma.centro.update({ where: { id }, data: datosCentro(d, zonaId) })

  revalidatePath("/centros")
  revalidatePath(`/centros/${id}`)
  return exito("Cambios guardados")
}

export async function cambiarEstatusCentro(
  id: number,
  estatus: EstatusCentro
): Promise<ResultadoAccion> {
  const session = await requerirRol([...ROLES_EDICION])

  const existente = await prisma.centro.findUnique({ where: { id } })
  if (!existente) return fallo("El centro no existe.")
  if (
    session.user.rol === "coordinadora_zona" &&
    existente.zonaId !== session.user.zonaId
  ) {
    return fallo("No puedes modificar centros fuera de tu zona.")
  }

  await prisma.centro.update({ where: { id }, data: { estatus } })

  revalidatePath("/centros")
  revalidatePath(`/centros/${id}`)
  return exito("Estatus actualizado")
}

// --- Asignación de clases a un centro ---------------------------------------

export async function asignarClase(
  centroId: number,
  input: AsignarClaseInput
): Promise<ResultadoAccion> {
  const session = await requerirRol([...ROLES_EDICION])

  const centro = await prisma.centro.findUnique({ where: { id: centroId } })
  if (!centro) return fallo("El centro no existe.")
  if (
    session.user.rol === "coordinadora_zona" &&
    centro.zonaId !== session.user.zonaId
  ) {
    return fallo("No puedes asignar clases a centros fuera de tu zona.")
  }

  const parsed = asignarClaseSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }
  const d = parsed.data

  await prisma.claseCentro.create({
    data: {
      centroId,
      claseId: d.claseId,
      profesorId: d.profesorId ?? null,
      nivelGrupo: d.nivelGrupo || null,
      observaciones: d.observaciones || null,
      horarios: {
        create: d.horarios.map((h) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        })),
      },
    },
  })

  revalidatePath(`/centros/${centroId}`)
  return exito("Clase asignada al centro")
}

export async function cambiarEstatusClaseCentro(
  claseCentroId: number,
  centroId: number,
  estatus: "activa" | "inactiva"
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES_EDICION])
  await prisma.claseCentro.update({
    where: { id: claseCentroId },
    data: { estatus },
  })
  revalidatePath(`/centros/${centroId}`)
  return exito(estatus === "activa" ? "Clase reactivada" : "Clase retirada del centro")
}
