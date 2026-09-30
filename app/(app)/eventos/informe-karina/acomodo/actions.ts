"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { TAG_ACOMODO } from "@/lib/data/informe-acomodo"
import {
  POR_REVISAR,
  type AsistenciaInforme,
  type InvitadoAcomodo,
} from "@/lib/eventos/informe-acomodo"
import {
  invitadoAcomodoSchema,
  moverGrupoSchema,
  type InvitadoAcomodoInput,
  type MoverGrupoInput,
} from "@/lib/schemas/informe-acomodo"

// Acciones del editor del acomodo. Solo usuarios con sesión; la página
// pública del staff es de solo lectura.

const RUTA = "/eventos/informe-karina/acomodo"

export type ResultadoAcomodo =
  | { ok: true; mensaje: string; invitado?: InvitadoAcomodo }
  | { ok: false; error: string }

const SELECT = {
  id: true,
  nombre: true,
  titulo: true,
  cargo: true,
  grupo: true,
  bloques: true,
  asistencia: true,
  nota: true,
  tejedora: true,
} as const

/** Invalida la caché de la página pública y refresca el panel. */
function refrescar() {
  revalidateTag(TAG_ACOMODO)
  revalidatePath("/informe/staff")
  revalidatePath(RUTA)
}

/** Deja solo bloques que existen (o «Por revisar»), sin repetir y en orden. */
async function limpiarBloques(bloques: string[]): Promise<string[] | null> {
  const validos = await prisma.informeBloque.findMany({
    select: { id: true },
    orderBy: { orden: "asc" },
  })
  const orden = validos.map((b) => b.id)
  const pedidos = new Set(bloques)
  for (const b of Array.from(pedidos)) {
    if (b !== POR_REVISAR && !orden.includes(b)) return null
  }
  // «Por revisar» no se combina con bloques reales.
  const reales = orden.filter((id) => pedidos.has(id))
  if (reales.length > 0) return reales
  return pedidos.has(POR_REVISAR) ? [POR_REVISAR] : []
}

export async function guardarInvitadoAcomodo(
  id: number | null,
  input: InvitadoAcomodoInput
): Promise<ResultadoAcomodo> {
  await requerirSesion()
  const parsed = invitadoAcomodoSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const d = parsed.data

  // Las tejedoras van aparte, sin bloque.
  const bloques = d.tejedora ? [] : await limpiarBloques(d.bloques)
  if (bloques === null) return { ok: false, error: "Hay un bloque que no existe." }

  const data = {
    nombre: d.nombre,
    titulo: d.titulo,
    cargo: d.cargo,
    grupo: d.grupo,
    bloques,
    asistencia: d.asistencia,
    nota: d.nota,
    tejedora: d.tejedora,
  }

  try {
    const invitado = id
      ? await prisma.informeInvitado.update({ where: { id }, data, select: SELECT })
      : await prisma.informeInvitado.create({ data, select: SELECT })
    refrescar()
    return {
      ok: true,
      mensaje: id ? "Invitado actualizado" : "Invitado agregado",
      invitado,
    }
  } catch {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." }
  }
}

export async function cambiarAsistenciaAcomodo(
  id: number,
  asistencia: AsistenciaInforme
): Promise<ResultadoAcomodo> {
  await requerirSesion()
  if (!["confirmado", "no_asiste", "sin_confirmar"].includes(asistencia)) {
    return { ok: false, error: "Asistencia inválida" }
  }
  try {
    const invitado = await prisma.informeInvitado.update({
      where: { id },
      data: { asistencia },
      select: SELECT,
    })
    refrescar()
    return { ok: true, mensaje: "Asistencia actualizada", invitado }
  } catch {
    return { ok: false, error: "No se pudo actualizar. Intenta de nuevo." }
  }
}

/** Baja lógica: el registro se conserva, solo deja de aparecer. */
export async function darDeBajaInvitadoAcomodo(id: number): Promise<ResultadoAcomodo> {
  await requerirSesion()
  try {
    await prisma.informeInvitado.update({ where: { id }, data: { estatus: "baja" } })
    refrescar()
    return { ok: true, mensaje: "Invitado quitado de la lista" }
  } catch {
    return { ok: false, error: "No se pudo quitar. Intenta de nuevo." }
  }
}

/**
 * Asigna bloques a TODOS los invitados activos de un grupo (p. ej. sacar a
 * «Seccionales» de «Por revisar»). Opcionalmente agrega el nombre del grupo a
 * la descripción de los bloques destino, para que la vista del bloque diga
 * que ese grupo va ahí.
 */
export async function moverGrupoAcomodo(
  input: MoverGrupoInput
): Promise<ResultadoAcomodo & { cuantos?: number; bloques?: string[] }> {
  await requerirSesion()
  const parsed = moverGrupoSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const { grupo, anotarEnBloques } = parsed.data
  const bloques = await limpiarBloques(parsed.data.bloques)
  if (bloques === null || bloques.length === 0) {
    return { ok: false, error: "Elige al menos un bloque válido." }
  }

  try {
    const r = await prisma.informeInvitado.updateMany({
      where: { grupo, estatus: "activo" },
      data: { bloques, tejedora: false },
    })

    if (anotarEnBloques && bloques[0] !== POR_REVISAR) {
      const destino = await prisma.informeBloque.findMany({
        where: { id: { in: bloques } },
        select: { id: true, grupos: true },
      })
      for (const b of destino) {
        const ya = b.grupos
          .toLowerCase()
          .split(",")
          .map((s) => s.trim())
          .includes(grupo.toLowerCase())
        if (!ya) {
          await prisma.informeBloque.update({
            where: { id: b.id },
            data: { grupos: b.grupos ? `${b.grupos}, ${grupo}` : grupo },
          })
        }
      }
    }

    refrescar()
    return {
      ok: true,
      mensaje: `${r.count} ${r.count === 1 ? "invitado movido" : "invitados movidos"} a ${bloques.join(" · ")}`,
      cuantos: r.count,
      bloques,
    }
  } catch {
    return { ok: false, error: "No se pudo mover el grupo. Intenta de nuevo." }
  }
}
