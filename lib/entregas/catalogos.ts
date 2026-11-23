// =============================================================================
//  Entregas — fuente única de verdad de catálogos y reglas (TS puro).
//
//  Una CAMPAÑA es una entrega por tema y año ("Dulces y piñatas · Día del Niño
//  2026") con los ARTÍCULOS que reparte y cuántos hay. Cada SOLICITUD escaneada
//  recibe un folio al subirse (DDN-001) y lleva, por artículo, lo solicitado y
//  lo autorizado. Su estado avanza en orden: recibida → autorizada →
//  contactada → entregada (o no procede).
// =============================================================================

type Opcion<T extends string = string> = { valor: T; label: string }

export const label = (lista: Opcion[], valor: string) => lista.find((o) => o.valor === valor)?.label ?? valor

// --- Artículos de una campaña ------------------------------------------------------

export type Articulo = { clave: string; nombre: string; disponible: number | null }
export type Cantidades = Record<string, { solicitado: number | null; autorizado: number | null }>

/** "Bolsitas de dulces" → "bolsitas_de_dulces" (clave estable para guardar cantidades). */
export function claveArticulo(nombre: string): string {
  return (
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "articulo"
  )
}

export function leerArticulos(json: unknown): Articulo[] {
  if (!Array.isArray(json)) return []
  return json
    .filter((a): a is Articulo => !!a && typeof a === "object" && typeof (a as Articulo).clave === "string")
    .map((a) => ({ clave: a.clave, nombre: String(a.nombre ?? a.clave), disponible: typeof a.disponible === "number" ? a.disponible : null }))
}

export function leerCantidades(json: unknown): Cantidades {
  if (!json || typeof json !== "object") return {}
  const out: Cantidades = {}
  for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
    const c = (v ?? {}) as { solicitado?: unknown; autorizado?: unknown }
    out[k] = {
      solicitado: typeof c.solicitado === "number" ? c.solicitado : null,
      autorizado: typeof c.autorizado === "number" ? c.autorizado : null,
    }
  }
  return out
}

// --- Folio --------------------------------------------------------------------------

export const normalizarPrefijo = (p: string) => p.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
export const folioSolicitud = (prefijo: string, consecutivo: number) => `${prefijo}-${String(consecutivo).padStart(3, "0")}`

// --- Quién solicita -------------------------------------------------------------------

export const CATEGORIAS: Opcion[] = [
  { valor: "asociacion_civil", label: "Asociación civil" },
  { valor: "regiduria", label: "Regiduría" },
  { valor: "congreso", label: "Congreso del Estado" },
  { valor: "dependencia", label: "Dependencia de gobierno" },
  { valor: "dif", label: "DIF" },
  { valor: "escuela", label: "Escuela" },
  { valor: "comite_vecinos", label: "Comité de vecinos" },
  { valor: "iglesia", label: "Iglesia o asociación religiosa" },
  { valor: "zona_rural", label: "Zona rural / seccional" },
  { valor: "ciudadano", label: "Ciudadano(a)" },
  { valor: "por_definir", label: "Por definir" },
]

// --- Estado de la solicitud --------------------------------------------------------------

export type EstadoSolicitud = "recibida" | "autorizada" | "contactada" | "entregada" | "no_procede"

export const ESTADOS_SOLICITUD: (Opcion<EstadoSolicitud> & { descripcion: string; punto: string })[] = [
  { valor: "recibida", label: "Recibida", descripcion: "Registrada; falta decidir cuánto se autoriza.", punto: "bg-rose-500" },
  { valor: "autorizada", label: "Autorizada", descripcion: "Ya se definió cuánto se entrega; falta avisar.", punto: "bg-amber-500" },
  { valor: "contactada", label: "Contactada", descripcion: "Se le avisó cuándo y dónde recoger.", punto: "bg-sky-500" },
  { valor: "entregada", label: "Entregada", descripcion: "Ya se recogió.", punto: "bg-green-600" },
  { valor: "no_procede", label: "No procede", descripcion: "No se le entregará (fuera de tiempo, duplicada, sin inventario…).", punto: "bg-slate-400" },
]

export const ESTADOS_PENDIENTES: EstadoSolicitud[] = ["recibida", "autorizada", "contactada"]

/** Lo autorizado cuenta contra el inventario mientras no esté en "no procede". */
export const cuentaContraInventario = (estado: string) => estado !== "no_procede" && estado !== "recibida"

// --- Fechas ---------------------------------------------------------------------------------

export function hoyChihuahua(): string {
  return new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10)
}
export const aISO = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)
export function fechaCorta(iso: string | null): string {
  if (!iso) return "—"
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}

export const MAX_BYTES_ARCHIVO = 4 * 1024 * 1024
export const TIPOS_ARCHIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

/** Extensión para guardar el escaneo con su folio: DYP-001.jpg */
export function extensionArchivo(tipo: string): string {
  const t = tipo.split(";")[0].trim().toLowerCase()
  if (t === "image/jpeg") return "jpg"
  if (t === "application/pdf") return "pdf"
  if (t.startsWith("image/")) return t.slice(6)
  return "bin"
}
