"use server"

import { revalidatePath } from "next/cache"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { aTitulo } from "@/lib/texto"
import { claveColaborador } from "@/lib/eventos/informe"
import {
  registroInformeSchema,
  type RegistroInformeInput,
} from "@/lib/schemas/informe"

export type ResultadoRegistroInforme =
  | { ok: true }
  /** `duplicado` distingue el bloqueo por registro repetido de un fallo técnico. */
  | { ok: false; error: string; duplicado?: boolean }

function mensajeDuplicado(nombre: string): string {
  return (
    `Ya existe un registro a nombre de ${nombre}. Cada colaborador se registra ` +
    `una sola vez e incluye ahí a todos sus familiares. Si necesitas agregar a ` +
    `alguien más, modificar tu registro o eres otra persona con el mismo nombre, ` +
    `acude con el área organizadora.`
  )
}

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
  const colaborador = aTitulo(d.colaborador)
  const clave = claveColaborador(colaborador)

  try {
    // Un colaborador se registra una sola vez. Se consulta primero para poder
    // dar un mensaje con su nombre; el índice único de la base es la garantía
    // real y atrapa además los envíos simultáneos (ver el catch de P2002).
    const existente = await prisma.registroInforme.findFirst({
      where: { colaboradorClave: clave, estatus: "activo" },
      select: { colaborador: true },
    })
    if (existente) {
      return {
        ok: false,
        duplicado: true,
        error: mensajeDuplicado(existente.colaborador),
      }
    }

    await prisma.registroInforme.create({
      data: {
        // Normalización silenciosa: los nombres quedan en formato Título.
        colaborador,
        colaboradorClave: clave,
        area: aTitulo(d.area),
        invitados: d.invitados.map((i) => ({
          nombre: aTitulo(i.nombre),
          parentesco: i.parentesco,
        })),
      },
    })

    revalidatePath("/eventos/informe-karina")
    return { ok: true }
  } catch (e) {
    // Dos envíos al mismo tiempo: el índice único rechaza el segundo.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, duplicado: true, error: mensajeDuplicado(colaborador) }
    }

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
