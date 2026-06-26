"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { DOCUMENTOS_VERANO } from "@/lib/eventos/verano"

// Actualiza el status de documentos entregados de un NNA (uso interno).
export async function actualizarDocumentosVerano(
  id: number,
  documentos: string[]
): Promise<ResultadoAccion> {
  await requerirSesion()

  const validos = documentos.filter((d) =>
    DOCUMENTOS_VERANO.some((doc) => doc.id === d)
  )

  try {
    await prisma.inscripcionVerano.update({
      where: { id },
      data: { documentos: validos },
    })
    revalidatePath(`/eventos/verano-difertido/inscripciones/${id}`)
    revalidatePath("/eventos/verano-difertido/inscripciones")
    return exito("Documentos actualizados")
  } catch {
    return fallo("No se pudo actualizar el status de documentos.")
  }
}
