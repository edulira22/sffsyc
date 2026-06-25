// =============================================================================
//  Áreas de la plataforma — definición PURA (sin iconos ni React).
//  Es la fuente única de verdad del control de acceso por área.
//  Al ser TS puro, se puede importar desde el middleware (edge), el servidor
//  y el cliente sin arrastrar dependencias pesadas.
//
//  Para agregar un área nueva en el futuro:
//    1. Agrega su objeto aquí (id, título, y las rutas que le pertenecen).
//    2. Dale su icono y submódulos en lib/navegacion.ts (presentación).
//  Nada más: el sidebar, el formulario de usuarios y el guard la toman de aquí.
// =============================================================================

export type AreaId = "centros-comunitarios" | "mantenimiento" | "eventos"

export type AreaDef = {
  id: AreaId
  titulo: string
  descripcion: string
  proximamente?: boolean
  /** Prefijos de ruta que pertenecen a esta área (para el guard de acceso). */
  rutas: string[]
}

export const AREAS: AreaDef[] = [
  {
    id: "centros-comunitarios",
    titulo: "Centros Comunitarios",
    descripcion: "Centros, beneficiarios, clases y coordinación",
    rutas: ["/centros", "/beneficiarios", "/captura-mensual", "/catalogos", "/datos"],
  },
  {
    id: "mantenimiento",
    titulo: "Mantenimiento",
    descripcion: "Bitácoras, solicitudes y seguimiento de mantenimiento",
    proximamente: true,
    rutas: ["/mantenimiento"],
  },
  {
    id: "eventos",
    titulo: "Eventos",
    descripcion: "Programación y seguimiento de eventos institucionales",
    rutas: ["/eventos"],
  },
]

/**
 * ¿El usuario puede entrar a esta área?
 * Regla práctica para herramienta interna: lista vacía = acceso a TODO.
 * Así, los usuarios existentes y quien no se configure conservan acceso total;
 * los checkboxes solo sirven para RESTRINGIR.
 */
export function puedeAccederArea(
  areasPermitidas: string[] | null | undefined,
  areaId: string
): boolean {
  if (!areasPermitidas || areasPermitidas.length === 0) return true
  return areasPermitidas.includes(areaId)
}

/**
 * Normaliza la selección de áreas antes de guardar:
 *  - Quita ids inválidos.
 *  - Si quedan todas (o ninguna) → devuelve [] = "acceso a todo".
 *  - Si es un subconjunto → lo devuelve tal cual (restricción real).
 */
export function normalizarAreas(seleccionadas: string[]): string[] {
  const validas = seleccionadas.filter((id) => AREAS.some((a) => a.id === id))
  if (validas.length === 0 || validas.length === AREAS.length) return []
  return validas
}

/** Títulos legibles de una lista de ids de área (para mostrar en tablas). */
export function nombresAreas(ids: string[]): string[] {
  return AREAS.filter((a) => ids.includes(a.id)).map((a) => a.titulo)
}

/** Devuelve el id del área a la que pertenece una ruta, o null si no aplica. */
export function areaDeRuta(pathname: string): AreaId | null {
  for (const area of AREAS) {
    if (area.rutas.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      return area.id
    }
  }
  return null
}
