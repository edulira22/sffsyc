"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { aTitulo, aOracion, soloDigitos } from "@/lib/texto"
import {
  personalVeranoSchema,
  claseVeranoSchema,
  horarioVeranoSchema,
  type PersonalVeranoInput,
  type ClaseVeranoInput,
  type HorarioVeranoInput,
} from "@/lib/schemas/verano-clases"

const RUTA = "/eventos/verano-difertido/clases"

// ----------------------------- Personal --------------------------------------

export async function guardarPersonalVerano(
  id: number | null,
  input: PersonalVeranoInput
): Promise<ResultadoAccion> {
  await requerirSesion()
  const parsed = personalVeranoSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data

  const data = {
    nombre: aTitulo(d.nombre),
    tipo: d.tipo,
    rol: aTitulo(d.rol) || null,
    telefono: soloDigitos(d.telefono) || null,
  }
  try {
    if (id) await prisma.personalVerano.update({ where: { id }, data })
    else await prisma.personalVerano.create({ data })
    revalidatePath(RUTA)
    return exito(id ? "Personal actualizado" : "Personal agregado")
  } catch {
    return fallo("No se pudo guardar.")
  }
}

export async function eliminarPersonalVerano(id: number): Promise<ResultadoAccion> {
  await requerirSesion()
  try {
    // Baja lógica: si tuviera clases asignadas, la relación queda en null.
    await prisma.personalVerano.update({ where: { id }, data: { estatus: "inactivo" } })
    revalidatePath(RUTA)
    return exito("Personal eliminado")
  } catch {
    return fallo("No se pudo eliminar.")
  }
}

// ------------------------------ Clases ---------------------------------------

export async function guardarClaseVerano(
  id: number | null,
  input: ClaseVeranoInput
): Promise<ResultadoAccion> {
  await requerirSesion()
  const parsed = claseVeranoSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data

  const data = {
    nombre: aTitulo(d.nombre),
    descripcion: aOracion(d.descripcion) || null,
    maestroId: d.maestroId,
  }
  try {
    if (id) await prisma.claseVerano.update({ where: { id }, data })
    else await prisma.claseVerano.create({ data })
    revalidatePath(RUTA)
    return exito(id ? "Clase actualizada" : "Clase agregada")
  } catch {
    return fallo("No se pudo guardar.")
  }
}

export async function eliminarClaseVerano(id: number): Promise<ResultadoAccion> {
  await requerirSesion()
  try {
    // Borra la clase y sus bloques de horario (cascade en BD).
    await prisma.claseVerano.delete({ where: { id } })
    revalidatePath(RUTA)
    return exito("Clase eliminada")
  } catch {
    return fallo("No se pudo eliminar.")
  }
}

// ------------------------------ Horario --------------------------------------

export async function agregarBloqueHorario(
  input: HorarioVeranoInput
): Promise<ResultadoAccion> {
  await requerirSesion()
  const parsed = horarioVeranoSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data
  try {
    await prisma.horarioVerano.create({
      data: {
        grupo: d.grupo,
        dia: d.dia,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
        claseId: d.claseId,
      },
    })
    revalidatePath(RUTA)
    return exito("Bloque agregado al horario")
  } catch {
    return fallo("No se pudo agregar el bloque.")
  }
}

export async function eliminarBloqueHorario(id: number): Promise<ResultadoAccion> {
  await requerirSesion()
  try {
    await prisma.horarioVerano.delete({ where: { id } })
    revalidatePath(RUTA)
    return exito("Bloque eliminado")
  } catch {
    return fallo("No se pudo eliminar el bloque.")
  }
}
