"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { aTitulo } from "@/lib/texto"
import {
  registroInformeSchema,
  type RegistroInformeInput,
} from "@/lib/schemas/informe"

export type ResultadoRegistroInforme =
  | { ok: true }
  | { ok: false; error: string }

// Ruta PÚBLICA: cualquier colaborador puede registrarse sin sesión, ya sea
// desde su celular o capturado por el personal de apoyo.
export async function registrarAsistenciaInforme(
  input: RegistroInformeInput
): Promise<ResultadoRegistroInforme> {
  const parsed = registroInformeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del registro",
    }
  }
  const d = parsed.data

  try {
    await prisma.registroInforme.create({
      data: {
        // Normalización silenciosa: los nombres quedan en formato Título.
        colaborador: aTitulo(d.colaborador),
        area: aTitulo(d.area),
        invitado: aTitulo(d.invitado),
        parentesco: d.parentesco,
      },
    })

    revalidatePath("/eventos/informe-karina")
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    if (msg.includes("registros_informe") || msg.includes("does not exist")) {
      return {
        ok: false,
        error:
          "El registro aún no está disponible en la base de datos. Avisa al administrador.",
      }
    }
    return { ok: false, error: "No se pudo enviar el registro. Intenta de nuevo." }
  }
}
