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

export type EstadoOficio =
  | "recibido"
  | "en_revision"
  | "en_transito"
  | "en_espera"
  | "canalizado"
  | "no_aplica"
  | "concluido"

/** Etapa del trámite: ordena los estados y les da color (rojo → ámbar → verde). */
export type EtapaOficio = "por_atender" | "en_curso" | "cerrado"

export const ETAPAS_OFICIO: (Opcion<EtapaOficio> & { texto: string })[] = [
  { valor: "por_atender", label: "Por atender", texto: "text-rose-700" },
  { valor: "en_curso", label: "En curso", texto: "text-amber-700" },
  { valor: "cerrado", label: "Cerrado", texto: "text-green-700" },
]

export const ESTADOS_OFICIO: (Opcion<EstadoOficio> & {
  etapa: EtapaOficio
  descripcion: string
  /** Insignia del estado (relleno). */
  clase: string
  /** Botón de un estado que no es el actual (contorno del mismo color). */
  contorno: string
  /** Punto de color para columnas y leyendas. */
  punto: string
})[] = [
  { valor: "recibido", label: "Recibido", etapa: "por_atender", descripcion: "Llegó y está registrado; nadie lo ha tomado aún.", clase: "bg-rose-100 text-rose-700 border-rose-200", contorno: "border-rose-200 text-rose-700 hover:bg-rose-50", punto: "bg-rose-500" },
  { valor: "en_revision", label: "En revisión", etapa: "en_curso", descripcion: "Se está analizando o atendiendo.", clase: "bg-amber-100 text-amber-800 border-amber-200", contorno: "border-amber-200 text-amber-800 hover:bg-amber-50", punto: "bg-amber-400" },
  { valor: "en_transito", label: "En tránsito", etapa: "en_curso", descripcion: "Se gestiona con otra área o dependencia; va en camino.", clase: "bg-amber-100 text-amber-800 border-amber-200", contorno: "border-amber-200 text-amber-800 hover:bg-amber-50", punto: "bg-amber-500" },
  { valor: "en_espera", label: "En espera", etapa: "en_curso", descripcion: "Detenido: falta información, una firma o la respuesta de alguien más.", clase: "bg-amber-100 text-amber-800 border-amber-200", contorno: "border-amber-200 text-amber-800 hover:bg-amber-50", punto: "bg-amber-600" },
  { valor: "canalizado", label: "Canalizado", etapa: "cerrado", descripcion: "Se turnó a otra área o dependencia que lo atenderá.", clase: "bg-green-100 text-green-700 border-green-200", contorno: "border-green-200 text-green-700 hover:bg-green-50", punto: "bg-green-400" },
  { valor: "no_aplica", label: "No aplica", etapa: "cerrado", descripcion: "No requiere acción (informativo, duplicado o fuera de nuestro ámbito).", clase: "bg-green-100 text-green-700 border-green-200", contorno: "border-green-200 text-green-700 hover:bg-green-50", punto: "bg-green-300" },
  { valor: "concluido", label: "Concluido", etapa: "cerrado", descripcion: "Resuelto o respondido.", clase: "bg-green-200 text-green-800 border-green-300", contorno: "border-green-300 text-green-800 hover:bg-green-50", punto: "bg-green-600" },
]

/** Estados que todavía exigen trabajo. */
export const ESTADOS_PENDIENTES: EstadoOficio[] = ["recibido", "en_revision", "en_transito", "en_espera"]

export function esPendiente(estado: string): boolean {
  return (ESTADOS_PENDIENTES as string[]).includes(estado)
}

// --- Área responsable --------------------------------------------------------

export type AreaOficio =
  | "centros_comunitarios"
  | "asociaciones_civiles"
  | "secretaria_tecnica"
  | "administrativo"
  | "transparencia"
  | "por_definir"

export const AREAS_OFICIO: (Opcion<AreaOficio> & { criterio: string })[] = [
  { valor: "centros_comunitarios", label: "Centros Comunitarios", criterio: "Uso de centros comunitarios, CEDEFAM, Centro STEM, auditorios o instalaciones (también cuando lo pide una dependencia o una A.C.); cursos, talleres y actividades en los centros; su operación diaria (instructores, usuarios, horarios, unidades móviles)." },
  { valor: "asociaciones_civiles", label: "Asociaciones civiles", criterio: "Escritos de A.C., fundaciones, OSC, IBP, clubes o colectivos sobre su relación con el DIF: proyectos, convenios, informes de actividades o de gastos y solicitudes de apoyo económico o en especie para su causa." },
  { valor: "secretaria_tecnica", label: "Secretaría Técnica", criterio: "Tareas de oficina, casi siempre internas, que piden una acción administrativa específica o dar resolución a una solicitud: designar enlaces, enviar información o reportes, llenar formatos, lineamientos, comités, invitaciones institucionales y peticiones de apoyos que hay que resolver." },
  { valor: "administrativo", label: "Administrativo", criterio: "Lo básico de oficina que implica dinero o recursos: nómina, personal, compras y licitaciones, pagos, limpieza, mantenimiento, vehículos, mobiliario, inventarios y presupuesto." },
  { valor: "transparencia", label: "Transparencia", criterio: "Solicitudes de la Unidad de Transparencia: acceso a la información pública u obligaciones de transparencia a las que hay que dar respuesta en plazo." },
  { valor: "por_definir", label: "Por definir", criterio: "No es claro a qué área corresponde." },
]

// --- Tipo de documento -------------------------------------------------------

export type TipoOficio = "solicitud" | "invitacion" | "informativo" | "circular" | "requerimiento" | "respuesta" | "otro"

export const TIPOS_OFICIO: Opcion<TipoOficio>[] = [
  { valor: "solicitud", label: "Solicitud" },
  { valor: "invitacion", label: "Invitación" },
  { valor: "informativo", label: "Informativo" },
  { valor: "circular", label: "Circular" },
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
