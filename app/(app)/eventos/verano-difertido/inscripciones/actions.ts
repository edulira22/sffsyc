"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { DOCUMENTOS_VERANO } from "@/lib/eventos/verano"

// Actualiza el status de requisitos de un NNA (uso interno): documentos
// entregados y número de recibo de pago.
export async function actualizarStatusVerano(
  id: number,
  documentos: string[],
  reciboPago: string
): Promise<ResultadoAccion> {
  await requerirSesion()

  const validos = documentos.filter((d) =>
    DOCUMENTOS_VERANO.some((doc) => doc.id === d)
  )
  const recibo = reciboPago.trim()

  try {
    await prisma.inscripcionVerano.update({
      where: { id },
      data: { documentos: validos, reciboPago: recibo || null },
    })
    revalidatePath(`/eventos/verano-difertido/inscripciones/${id}`)
    revalidatePath("/eventos/verano-difertido/inscripciones")
    return exito("Status actualizado")
  } catch {
    return fallo("No se pudo actualizar el status.")
  }
}
