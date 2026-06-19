"use server"

import { revalidatePath } from "next/cache"
import type { EstatusActivo } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requerirRol } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { profesorSchema, type ProfesorInput } from "@/lib/schemas/profesor"

const ROLES = ["admin", "coordinacion_general"] as const

function datosProfesor(d: ProfesorInput) {
  return {
    nombre: d.nombre,
    apellidoPaterno: d.apellidoPaterno,
    apellidoMaterno: d.apellidoMaterno || null,
    telefono: d.telefono || null,
    especialidad: d.especialidad || null,
    observaciones: d.observaciones || null,
  }
}

export async function crearProfesor(input: ProfesorInput): Promise<ResultadoAccion> {
  await requerirRol([...ROLES])
  const parsed = profesorSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")

  await prisma.profesor.create({ data: datosProfesor(parsed.data) })
  revalidatePath("/catalogos/profesores")
  return exito("Profesor registrado")
}

export async function editarProfesor(
  id: number,
  input: ProfesorInput
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES])
  const parsed = profesorSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")

  await prisma.profesor.update({ where: { id }, data: datosProfesor(parsed.data) })
  revalidatePath("/catalogos/profesores")
  return exito("Cambios guardados")
}

export async function cambiarEstatusProfesor(
  id: number,
  estatus: EstatusActivo
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES])
  await prisma.profesor.update({ where: { id }, data: { estatus } })
  revalidatePath("/catalogos/profesores")
  return exito(estatus === "activa" ? "Profesor activado" : "Profesor desactivado")
}
