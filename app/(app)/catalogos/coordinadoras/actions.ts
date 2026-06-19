"use server"

import { revalidatePath } from "next/cache"
import type { EstatusActivo } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requerirRol } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import {
  coordinadoraSchema,
  type CoordinadoraInput,
} from "@/lib/schemas/coordinadora"

const ROLES_AUTORIZADOS = ["admin", "coordinacion_general"] as const

// La zona solo se guarda cuando el rol es "zona".
function normalizarZona(input: CoordinadoraInput) {
  return input.rol === "zona" ? input.zonaId ?? null : null
}

export async function crearCoordinadora(
  input: CoordinadoraInput
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES_AUTORIZADOS])

  const parsed = coordinadoraSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }
  const d = parsed.data

  await prisma.coordinadora.create({
    data: {
      nombre: d.nombre,
      apellidoPaterno: d.apellidoPaterno,
      apellidoMaterno: d.apellidoMaterno || null,
      telefono: d.telefono || null,
      rol: d.rol,
      zonaId: normalizarZona(d),
    },
  })

  revalidatePath("/catalogos/coordinadoras")
  return exito("Coordinadora registrada")
}

export async function editarCoordinadora(
  id: number,
  input: CoordinadoraInput
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES_AUTORIZADOS])

  const parsed = coordinadoraSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }
  const d = parsed.data

  await prisma.coordinadora.update({
    where: { id },
    data: {
      nombre: d.nombre,
      apellidoPaterno: d.apellidoPaterno,
      apellidoMaterno: d.apellidoMaterno || null,
      telefono: d.telefono || null,
      rol: d.rol,
      zonaId: normalizarZona(d),
    },
  })

  revalidatePath("/catalogos/coordinadoras")
  return exito("Cambios guardados")
}

export async function cambiarEstatusCoordinadora(
  id: number,
  estatus: EstatusActivo
): Promise<ResultadoAccion> {
  await requerirRol([...ROLES_AUTORIZADOS])

  await prisma.coordinadora.update({ where: { id }, data: { estatus } })

  revalidatePath("/catalogos/coordinadoras")
  return exito(estatus === "activa" ? "Coordinadora activada" : "Coordinadora desactivada")
}
