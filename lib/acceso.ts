// =============================================================================
//  Control de acceso por sección (solo servidor).
//
//  Se lee de la base de datos en cada solicitud (no del JWT): si a alguien le
//  quitan una sección o lo desactivan, el cambio aplica de inmediato.
//   - Secciones: `areas_permitidas` (vacío = todas), ver lib/areas.ts.
//   - Administración (usuarios, contraseñas, zonas): `es_admin_sistema`,
//     un permiso aparte que nadie tiene por defecto.
//  Páginas y Server Actions llaman requerirArea / requerirAdminSistema; si no
//  hay permiso, redirigen a /sin-acceso (también desde una acción).
// =============================================================================

import { cache } from "react"
import { redirect } from "next/navigation"
import type { Session } from "next-auth"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { AREAS, puedeAccederArea, type AreaId } from "@/lib/areas"

export type AccesoUsuario = {
  usuarioId: number | null
  activo: boolean
  esAdminSistema: boolean
  /** Ids de las secciones que puede usar. */
  areas: AreaId[]
}

// Una sola consulta por solicitud (layout, página y acciones la comparten). Fuera
// de Next, React no trae cache(): entonces simplemente no se memoriza.
const memorizar: <F extends (...args: never[]) => unknown>(f: F) => F = typeof cache === "function" ? cache : (f) => f

const accesoPorId = memorizar(async (id: number | null): Promise<AccesoUsuario> => {
  const u = id
    ? await prisma.usuarioSistema.findUnique({
        where: { id },
        select: { estatus: true, rol: true, areasPermitidas: true, esAdminSistema: true },
      })
    : null
  if (!u || u.estatus !== "activo") return { usuarioId: id, activo: false, esAdminSistema: false, areas: [] }
  // Los profesores del Centro STEM solo usan sus cursos (el middleware los encierra ahí).
  if (u.rol === "profesor_stem") return { usuarioId: id, activo: true, esAdminSistema: false, areas: ["centro-stem"] }
  return {
    usuarioId: id,
    activo: true,
    esAdminSistema: u.esAdminSistema,
    areas: AREAS.filter((a) => puedeAccederArea(u.areasPermitidas, a.id)).map((a) => a.id),
  }
})

export async function accesoDe(sesion: Session | null): Promise<AccesoUsuario> {
  const id = Number.parseInt(String(sesion?.user?.id ?? ""), 10)
  return accesoPorId(Number.isFinite(id) ? id : null)
}

/** Exige sesión y la sección indicada; si no, manda a /sin-acceso. Devuelve la sesión. */
export async function requerirArea(area: AreaId) {
  const sesion = await requerirSesion()
  const a = await accesoDe(sesion)
  if (!a.activo) redirect("/sin-acceso?motivo=inactivo")
  if (!a.areas.includes(area)) redirect(`/sin-acceso?seccion=${area}`)
  return sesion
}

/** Exige el permiso de Administración (usuarios, contraseñas, zonas). */
export async function requerirAdminSistema() {
  const sesion = await requerirSesion()
  const a = await accesoDe(sesion)
  if (!a.activo) redirect("/sin-acceso?motivo=inactivo")
  if (!a.esAdminSistema) redirect("/sin-acceso?seccion=administracion")
  return sesion
}
