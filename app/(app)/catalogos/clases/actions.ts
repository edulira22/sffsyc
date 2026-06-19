"use server"

import { revalidatePath } from "next/cache"
import type { EstatusActivo } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requerirRol } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { claseSchema, type ClaseInput } from "@/lib/schemas/clase"

const ROLES = ["admin", "coordinacion_general"] as const

export async function crearClase(input: ClaseInput): Promise<ResultadoAccion> {
  await requerirRol([...ROLES])

  const parsed = claseSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data

  await prisma.catalogoClase.create({
    data: {
      nombreOficial: d.nombreOficial,
      categoriaId: d.categoriaId,
      descripcion: d.descripcion || null,
      variantesAlias: d.variantesAlias || null,
    },
  })

  revalidatePath("/catalogos/clases")
  return exito("Clase registrada")
}

export async function editarClase(
  id: number,
  input: ClaseInput
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES])

  const parsed = claseSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data

  await prisma.catalogoClase.update({
    where: { id },
    data: {
      nombreOficial: d.nombreOficial,
      categoriaId: d.categoriaId,
      descripcion: d.descripcion || null,
      variantesAlias: d.variantesAlias || null,
    },
  })

  revalidatePath("/catalogos/clases")
  return exito("Cambios guardados")
}

export async function cambiarEstatusClase(
  id: number,
  estatus: EstatusActivo
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES])
  await prisma.catalogoClase.update({ where: { id }, data: { estatus } })
  revalidatePath("/catalogos/clases")
  return exito(estatus === "activa" ? "Clase activada" : "Clase desactivada")
}
