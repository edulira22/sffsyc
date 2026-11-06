// =============================================================================
//  Quién puede ver qué oficios (solo servidor).
//
//  Dos candados, leídos de la base de datos en cada solicitud (no del JWT):
//   1. La sección Oficios (`areas_permitidas` del usuario, como las demás
//      secciones de la plataforma).
//   2. Las áreas de oficios (`areas_oficios`): un usuario restringido solo ve
//      los oficios de sus áreas y, siempre, los que él mismo registró, para
//      no perderlos de vista al subirlos (llegan "Por definir").
//  Lista vacía = sin restricción, igual que en las secciones.
// =============================================================================

import type { Prisma } from "@prisma/client"
import type { Session } from "next-auth"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { puedeAccederArea } from "@/lib/areas"

export type AccesoOficios = {
  usuarioId: number | null
  nombre: string
  /** ¿Puede entrar a la sección Oficios? */
  entra: boolean
  /** Áreas de oficios que ve; null = todas. */
  areas: string[] | null
  /** Condición que se agrega a toda consulta de oficios. */
  filtro: Prisma.OficioWhereInput
}

export async function accesoOficios(sesion?: Session | null): Promise<AccesoOficios> {
  const s = sesion ?? (await requerirSesion())
  const id = Number.parseInt(String(s?.user?.id ?? ""), 10)
  const usuarioId = Number.isFinite(id) ? id : null
  const nombre = s?.user?.nombre ?? s?.user?.name ?? "Usuario"

  const u = usuarioId
    ? await prisma.usuarioSistema.findUnique({
        where: { id: usuarioId },
        select: { areasPermitidas: true, areasOficios: true },
      })
    : null

  const entra = puedeAccederArea(u?.areasPermitidas, "oficios")
  const areas = u && u.areasOficios.length > 0 ? u.areasOficios : null
  const filtro: Prisma.OficioWhereInput = !entra
    ? { id: -1 }
    : areas
      ? { OR: [{ areaResponsable: { in: areas } }, ...(usuarioId ? [{ creadoPorId: usuarioId }] : [])] }
      : {}

  return { usuarioId, nombre, entra, areas, filtro }
}
