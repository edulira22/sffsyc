// =============================================================================
//  Verano DIFertido 2026 — fuente única de verdad del evento.
//  Aquí viven los datos que comparten el formulario de inscripción, el tablero,
//  la configuración de clases y (más adelante) el algoritmo de asignación de
//  grupos. Si cambia una fecha, un grupo o un color, se cambia SOLO aquí.
// =============================================================================

export const EVENTO_VERANO = {
  nombre: "Verano DIFertido 2026",
  sede: "DIF Municipal de Chihuahua",
  // Fechas oficiales del curso (ISO, zona local).
  inicio: "2026-07-20",
  fin: "2026-08-07",
  horaEntrada: "8:00 am",
} as const

// --- Grupos -----------------------------------------------------------------

export type GrupoId =
  | "botzitos"
  | "robotines"
  | "botix"
  | "turbobots"
  | "megatronix"

export type GrupoVerano = {
  id: GrupoId
  nombre: string
  /** Color institucional del grupo (etiqueta legible). */
  color: string
  /** Color base en HEX para puntos/acentos. */
  hex: string
  /** Rango de edad nominal. El traslape 10–13 lo ajusta el algoritmo. */
  edadMin: number
  edadMax: number
  /** Hora de salida escalonada (del reglamento). */
  salida: string
  /** Clases utilitarias de Tailwind para tarjetas/insignias. */
  claseCard: string
  claseChip: string
}

export const GRUPOS_VERANO: GrupoVerano[] = [
  {
    id: "botzitos",
    nombre: "Botzitos",
    color: "Amarillo",
    hex: "#EAB308",
    edadMin: 5,
    edadMax: 6,
    salida: "1:30 pm",
    claseCard: "border-yellow-300 bg-yellow-50",
    claseChip: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    id: "robotines",
    nombre: "Robotines",
    color: "Verde",
    hex: "#16A34A",
    edadMin: 7,
    edadMax: 8,
    salida: "2:15 pm",
    claseCard: "border-green-300 bg-green-50",
    claseChip: "bg-green-100 text-green-800 border-green-300",
  },
  {
    id: "botix",
    nombre: "Botix",
    color: "Azul eléctrico",
    hex: "#2563EB",
    edadMin: 9,
    edadMax: 9,
    salida: "2:15 pm",
    claseCard: "border-blue-300 bg-blue-50",
    claseChip: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "turbobots",
    nombre: "TurboBots",
    color: "Naranja",
    hex: "#F97316",
    edadMin: 10,
    edadMax: 10,
    salida: "2:15 pm",
    claseCard: "border-orange-300 bg-orange-50",
    claseChip: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    id: "megatronix",
    nombre: "Megatronix",
    color: "Morado / Plata",
    hex: "#7C3AED",
    edadMin: 11,
    edadMax: 12,
    salida: "2:30 pm",
    claseCard: "border-purple-300 bg-purple-50",
    claseChip: "bg-purple-100 text-purple-800 border-purple-300",
  },
]

/**
 * Grupo SUGERIDO según la edad. Es solo una sugerencia para la captura:
 * la asignación final de TurboBots/Megatronix (edades 10–13) se nivela con
 * el algoritmo de reparto, que se ejecuta sobre el padrón completo.
 */
export function grupoSugeridoPorEdad(edad: number | null): GrupoVerano | null {
  if (edad === null || Number.isNaN(edad)) return null
  if (edad <= 6) return GRUPOS_VERANO[0] // botzitos
  if (edad <= 8) return GRUPOS_VERANO[1] // robotines
  if (edad === 9) return GRUPOS_VERANO[2] // botix
  if (edad === 10) return GRUPOS_VERANO[3] // turbobots
  return GRUPOS_VERANO[4] // 11+ megatronix
}

export function grupoPorId(id: string): GrupoVerano | undefined {
  return GRUPOS_VERANO.find((g) => g.id === id)
}

// --- Tallas de playera -------------------------------------------------------

export const TALLAS_VERANO = [
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "Ch",
  "M",
  "G",
  "XG",
] as const

export type TallaVerano = (typeof TALLAS_VERANO)[number]
