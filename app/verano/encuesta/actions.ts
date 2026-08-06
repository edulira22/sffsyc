"use server"

import { revalidatePath } from "next/cache"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { aTitulo } from "@/lib/texto"
import {
  encuestaPadresSchema,
  nombreEncuestaSchema,
  type EncuestaPadresInput,
} from "@/lib/schemas/encuesta-padres"

export type ResultadoEncuesta = { ok: true } | { ok: false; error: string }

// Ruta PÚBLICA: cualquier padre/tutor puede responder sin sesión.
// El nombre es opcional: si va vacío, la respuesta queda anónima.
export async function enviarEncuestaPadres(input: {
  nombre?: string
  respuestas: EncuestaPadresInput
}): Promise<ResultadoEncuesta> {
  const parsed = encuestaPadresSchema.safeParse(input.respuestas)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Faltan respuestas por completar",
    }
  }

  const nombreParsed = nombreEncuestaSchema.safeParse(input.nombre ?? "")
  if (!nombreParsed.success) {
    return {
      ok: false,
      error: nombreParsed.error.issues[0]?.message ?? "Nombre inválido",
    }
  }
  const nombre = aTitulo(nombreParsed.data) || null

  try {
    await prisma.encuestaPadresVerano.create({
      data: {
        nombre,
        respuestas: parsed.data as Prisma.InputJsonValue,
      },
    })

    revalidatePath("/eventos/verano-difertido/encuesta-padres")
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    if (msg.includes("encuestas_padres_verano") || msg.includes("does not exist")) {
      return {
        ok: false,
        error:
          "La encuesta aún no está disponible en la base de datos. Avisa al administrador.",
      }
    }
    return { ok: false, error: "No se pudo enviar la encuesta. Intenta de nuevo." }
  }
}
