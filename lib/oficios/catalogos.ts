// =============================================================================
//  Oficios — fuente única de verdad de catálogos y reglas.
//  TS puro (sin React ni Prisma): lo usan el servidor, el cliente y la IA.
//
//  Un oficio es un compromiso institucional: alguien lo recibió, alguien es
//  responsable de atenderlo y a veces hay un plazo. Por eso el registro lleva
//  folio interno, área responsable, estado y fecha límite, y cada cambio
//  queda en la bitácora de movimientos.
// =============================================================================

type Opcion<T extends string> = { valor: T; label: string }

// --- Estado del trámite ------------------------------------------------------

export type EstadoOficio = "recibido" | "turnado" | "en_proceso" | "atendido" | "archivado"

export const ESTADOS_OFICIO: (Opcion<EstadoOficio> & { descripcion: string; clase: string })[] = [
  { valor: "recibido", label: "Recibido", descripcion: "Registrado; falta asignarlo a un área.", clase: "bg-slate-100 text-slate-700 border-slate-200" },
  { valor: "turnado", label: "Turnado", descripcion: "Asignado al área responsable.", clase: "bg-sky-50 text-sky-800 border-sky-200" },
  { valor: "en_proceso", label: "En proceso", descripcion: "El área ya lo está atendiendo.", clase: "bg-amber-50 text-amber-800 border-amber-200" },
  { valor: "atendido", label: "Atendido", descripcion: "Resuelto o respondido.", clase: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { valor: "archivado", label: "Archivado", descripcion: "Cerrado sin acción (informativo, duplicado, etc.).", clase: "bg-zinc-100 text-zinc-500 border-zinc-200" },
]

/** Estados que todavía exigen trabajo. */
export const ESTADOS_PENDIENTES: EstadoOficio[] = ["recibido", "turnado", "en_proceso"]

export function esPendiente(estado: string): boolean {
  return (ESTADOS_PENDIENTES as string[]).includes(estado)
}

// --- Área responsable --------------------------------------------------------

export type AreaOficio =
  | "centros_comunitarios"
  | "asociaciones_civiles"
  | "proteccion_familiar"
  | "asistencia_solidaria"
  | "por_definir"

export const AREAS_OFICIO: (Opcion<AreaOficio> & { criterio: string })[] = [
  { valor: "centros_comunitarios", label: "Centros Comunitarios", criterio: "Uso de centros comunitarios, CEDEFAM, auditorios o instalaciones; actividades y talleres en centros." },
  { valor: "asociaciones_civiles", label: "Asociaciones civiles", criterio: "Escritos de A.C., OSC, IBP, fundaciones, museos u organizaciones de la sociedad civil." },
  { valor: "proteccion_familiar", label: "Protección Familiar", criterio: "Temas jurídicos, niñas, niños y adolescentes, protección de derechos, CEDH, violencia familiar." },
  { valor: "asistencia_solidaria", label: "Asistencia Solidaria", criterio: "Solicitudes ciudadanas de apoyos (económicos, en especie, alimentarios)." },
  { valor: "por_definir", label: "Por definir", criterio: "No es claro a qué área corresponde." },
]

// --- Tipo de documento -------------------------------------------------------

export type TipoOficio = "solicitud" | "invitacion" | "informativo" | "requerimiento" | "respuesta" | "otro"

export const TIPOS_OFICIO: Opcion<TipoOficio>[] = [
  { valor: "solicitud", label: "Solicitud" },
  { valor: "invitacion", label: "Invitación" },
  { valor: "informativo", label: "Informativo" },
  { valor: "requerimiento", label: "Requerimiento (con plazo)" },
  { valor: "respuesta", label: "Respuesta a un oficio nuestro" },
  { valor: "otro", label: "Otro" },
]

// --- Prioridad ---------------------------------------------------------------

export type PrioridadOficio = "normal" | "alta" | "urgente"

export const PRIORIDADES_OFICIO: (Opcion<PrioridadOficio> & { clase: string })[] = [
  { valor: "normal", label: "Normal", clase: "text-muted-foreground" },
  { valor: "alta", label: "Alta", clase: "text-amber-700" },
  { valor: "urgente", label: "Urgente", clase: "text-rose-700" },
]

// --- Utilidades --------------------------------------------------------------

export function label<T extends string>(lista: Opcion<T>[], valor: string): string {
  return lista.find((o) => o.valor === valor)?.label ?? valor
}

export function valores<T extends string>(lista: Opcion<T>[]): [T, ...T[]] {
  return lista.map((o) => o.valor) as [T, ...T[]]
}

/** Folio interno: OF26-0001. Reinicia cada año. */
export function folioOficio(anio: number, consecutivo: number): string {
  return `OF${String(anio).slice(-2)}-${String(consecutivo).padStart(4, "0")}`
}

/** Días a partir de los cuales un plazo se considera "por vencer". */
export const DIAS_POR_VENCER = 3

export type Semaforo = "vencido" | "por_vencer" | "en_tiempo" | "sin_plazo" | "cerrado"

/**
 * Situación del plazo. `hoyISO` y `limiteISO` en formato YYYY-MM-DD para
 * comparar fechas de calendario sin problemas de zona horaria.
 */
export function semaforo(estado: string, limiteISO: string | null, hoyISO: string): Semaforo {
  if (!esPendiente(estado)) return "cerrado"
  if (!limiteISO) return "sin_plazo"
  const dias = diasEntre(hoyISO, limiteISO)
  if (dias < 0) return "vencido"
  if (dias <= DIAS_POR_VENCER) return "por_vencer"
  return "en_tiempo"
}

/** Días de calendario de `desdeISO` a `hastaISO` (negativo si ya pasó). */
export function diasEntre(desdeISO: string, hastaISO: string): number {
  const a = Date.UTC(+desdeISO.slice(0, 4), +desdeISO.slice(5, 7) - 1, +desdeISO.slice(8, 10))
  const b = Date.UTC(+hastaISO.slice(0, 4), +hastaISO.slice(5, 7) - 1, +hastaISO.slice(8, 10))
  return Math.round((b - a) / 86_400_000)
}

/** Fecha de hoy en Chihuahua, YYYY-MM-DD. */
export function hoyChihuahua(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chihuahua",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Date de Prisma (@db.Date) → YYYY-MM-DD, o null. */
export function aISO(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null
}

/** Límite del archivo que se sube (Vercel acepta hasta 4.5 MB por petición). */
export const MAX_BYTES_ARCHIVO = 4 * 1024 * 1024

export const TIPOS_ARCHIVO_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
