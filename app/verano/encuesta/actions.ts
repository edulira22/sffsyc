"use server"

import { revalidatePath } from "next/cache"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import {
  encuestaPadresSchema,
  type EncuestaPadresInput,
} from "@/lib/schemas/encuesta-padres"

export type ResultadoEncuesta = { ok: true } | { ok: false; error: string }

// Ruta PÚBLICA: cualquier padre/tutor puede responder sin sesión.
// No se guarda ningún dato identificable: la encuesta es anónima.
export async function enviarEncuestaPadres(
  input: EncuestaPadresInput
): Promise<ResultadoEncuesta> {
  const parsed = encuestaPadresSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Faltan respuestas por completar",
    }
  }

  try {
    await prisma.encuestaPadresVerano.create({
      data: { respuestas: parsed.data as Prisma.InputJsonValue },
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
