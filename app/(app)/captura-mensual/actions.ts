"use server"

import { requerirSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ClaseOpcion } from "@/components/centros/registrador-masivo"

export async function obtenerClasesCentro(centroId: number): Promise<ClaseOpcion[]> {
  const session = await requerirSesion()

  const centro = await prisma.centro.findUnique({
    where: { id: centroId },
    select: { zonaId: true },
  })
  if (!centro) return []

  if (session.user.rol === "coordinadora_zona" && centro.zonaId !== session.user.zonaId) {
    return []
  }

  const clases = await prisma.claseCentro.findMany({
    where: { centroId, estatus: "activa" },
    select: {
      id: true,
      clase: { select: { nombreOficial: true, categoria: { select: { nombre: true } } } },
    },
    orderBy: { clase: { nombreOficial: "asc" } },
  })

  return clases.map((c) => ({
    id: c.id,
    nombre: c.clase.nombreOficial,
    categoria: c.clase.categoria.nombre,
  }))
}
