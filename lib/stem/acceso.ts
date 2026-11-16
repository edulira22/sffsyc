// =============================================================================
//  Centro STEM — quién puede hacer qué (solo servidor).
//
//  - Administrador: usuario normal (no profesor) con la sección "centro-stem"
//    en areas_permitidas (vacío = todas). Gestiona todo el módulo.
//  - Profesor: usuario con rol profesor_stem y perfil en stem_profesores.
//    Solo ve SUS cursos: alumnos (con su información) y asistencia. El
//    middleware además lo encierra en /stem/mis-cursos.
//  Se lee de la base en cada solicitud; nada depende de lo que diga la UI.
// =============================================================================

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { puedeAccederArea } from "@/lib/areas"

export type QuienStem = {
  usuarioId: number | null
  nombre: string
  esAdmin: boolean
  /** Perfil de profesor si el usuario es profesor STEM activo. */
  profesorId: number | null
}

export async function quienStem(): Promise<QuienStem> {
  const s = await requerirSesion()
  const id = Number.parseInt(String(s.user.id), 10)
  const usuarioId = Number.isFinite(id) ? id : null
  const nombre = s.user.nombre ?? s.user.name ?? "Usuario"
  if (!usuarioId) return { usuarioId, nombre, esAdmin: false, profesorId: null }

  const u = await prisma.usuarioSistema.findUnique({
    where: { id: usuarioId },
    select: { rol: true, estatus: true, areasPermitidas: true, profesorStem: { select: { id: true, estatus: true } } },
  })
  if (!u || u.estatus !== "activo") return { usuarioId, nombre, esAdmin: false, profesorId: null }
  if (u.rol === "profesor_stem") {
    const p = u.profesorStem
    return { usuarioId, nombre, esAdmin: false, profesorId: p && p.estatus === "activo" ? p.id : null }
  }
  return { usuarioId, nombre, esAdmin: puedeAccederArea(u.areasPermitidas, "centro-stem"), profesorId: null }
}

/** ¿Puede ver y tomar asistencia en este curso? Admin: todos; profesor: los suyos. */
export async function puedeVerCurso(q: QuienStem, cursoId: number): Promise<boolean> {
  if (q.esAdmin) return true
  if (!q.profesorId) return false
  const c = await prisma.stemCurso.findUnique({ where: { id: cursoId }, select: { profesorId: true } })
  return c?.profesorId === q.profesorId
}
