// =============================================================================
//  Acomodo del 5º Informe DIF Municipal — fuente única de verdad.
//  Plano del área del evento (2,500 sillas en abanico, 13 bloques) y reglas
//  para ubicar a cada invitado. Los datos vienen del proyecto de layout
//  (paquete_plataforma) y se cargan con scripts/cargar-acomodo-informe.ts.
//
//  Aquí NO hay datos personales: los invitados viven en la base de datos
//  (informe_invitados) porque el repositorio es público.
// =============================================================================

/**
 * Plano del área del evento, en metros. El viewBox del SVG es
 * "-1 -1 (w+2) (h+2)". `templete` es el path del templete y las pantallas,
 * que se dibuja como referencia.
 */
export const PLANO_INFORME = {
  w: 73.52,
  h: 69.52,
  templete:
    "M6.80,20.08L15.40,20.08L15.40,23.51L16.12,24.36L16.45,24.79L16.77,25.24L17.07,25.70L17.35,26.18L17.61,26.66L17.86,27.15L18.09,27.64L18.30,28.15L18.49,28.67L18.66,29.19L18.81,29.72L18.94,30.25L19.06,30.79L19.33,32.27L19.45,33.20L19.52,34.14L19.55,35.08L19.52,36.03L19.45,36.97L19.33,37.90L19.06,39.38L18.94,39.92L18.81,40.45L18.66,40.98L18.49,41.50L18.30,42.02L18.09,42.52L17.86,43.02L17.61,43.51L17.35,43.99L17.07,44.47L16.77,44.92L16.45,45.38L16.12,45.81L15.40,46.66L15.40,50.08L6.80,50.08ZM8.51,41.63L10.55,49.37L9.58,49.62L9.07,47.66L7.55,41.89ZM7.43,38.52L7.43,31.65L7.43,28.84L8.20,28.84L8.20,31.65L8.93,31.65L8.93,38.52L8.20,38.52L8.20,41.33L7.43,41.33ZM9.58,20.55L10.55,20.80L8.51,28.54L7.55,28.28L9.02,22.70Z",
} as const

/**
 * Zonas del plano que NO son bloques de invitados, pero que el staff debe
 * ubicar (p. ej. la porra). Coordenadas en metros, como los bloques.
 */
export const ZONAS_INFORME: {
  id: string
  nombre: string
  x: number
  y: number
  r: number
  descripcion: string
}[] = [
  {
    id: "porra",
    nombre: "Porra",
    x: 42.95,
    y: 10.03,
    r: 2.8,
    descripcion: "Entre B4 y C8. No es un bloque de invitados.",
  },
]

/** Valor especial de `bloques` para grupos que aún no tienen bloque asignado. */
export const POR_REVISAR = "POR REVISAR"

// --- Asistencia --------------------------------------------------------------

export type AsistenciaInforme = "confirmado" | "no_asiste" | "sin_confirmar"

export const ASISTENCIAS_INFORME: { valor: AsistenciaInforme; label: string }[] = [
  { valor: "confirmado", label: "Confirmado" },
  { valor: "sin_confirmar", label: "Sin confirmar" },
  { valor: "no_asiste", label: "No asiste" },
]

export function labelAsistencia(valor: string): string {
  return ASISTENCIAS_INFORME.find((a) => a.valor === valor)?.label ?? valor
}

// --- Lugares confirmados sin nombre ------------------------------------------

/**
 * Lugares confirmados en el Excel que no traen nombre: no se pueden buscar,
 * solo se cuentan. Se muestran como aviso para que el staff sepa que esas
 * personas también llegan.
 */
export const CONFIRMADOS_SIN_NOMBRE: {
  grupo: string
  lugares: number
  /** Bloques donde pueden sentarse, según la asignación. */
  bloques: string[]
}[] = [
  // A1.2 es el bloque de Familia DIF (60 sillas); lo que no quepa, a C8–C12.
  { grupo: "Familia DIF", lugares: 126, bloques: ["A1.2", "C8", "C9", "C10", "C11", "C12"] },
  { grupo: "Amigos Municipio", lugares: 38, bloques: ["C10", "C11", "C12"] },
]

// --- Tipos que comparten la página pública y el panel ------------------------

export type BloqueAcomodo = {
  id: string
  lugares: number
  grupos: string
  nota: string
  d: string
  x: number
  y: number
  filas: string[]
}

export type InvitadoAcomodo = {
  id: number
  nombre: string
  titulo: string
  cargo: string
  grupo: string
  bloques: string[]
  asistencia: string
  nota: string
  tejedora: boolean
}

/**
 * Normaliza los bloques pedidos contra los que existen: sin repetir, en el
 * orden del plano, y «Por revisar» nunca combinado con bloques reales.
 * Devuelve null si se pidió un bloque que no existe.
 */
export function normalizarBloques(pedidos: string[], existentes: string[]): string[] | null {
  const set = new Set(pedidos)
  for (const b of Array.from(set)) {
    if (b !== POR_REVISAR && !existentes.includes(b)) return null
  }
  const reales = existentes.filter((id) => set.has(id))
  if (reales.length > 0) return reales
  return set.has(POR_REVISAR) ? [POR_REVISAR] : []
}

/** Búsqueda sin acentos ni mayúsculas. */
export function normalizarBusqueda(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

/** Dónde va la persona, como texto: "A2", "B4 · B5 · C8 · C9" o "Tejedoras". */
export function dondeVa(p: Pick<InvitadoAcomodo, "tejedora" | "bloques">): string {
  if (p.tejedora) return "Tejedoras"
  if (p.bloques.length === 0) return "Sin bloque"
  return p.bloques.join(" · ")
}
