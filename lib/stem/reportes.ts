// =============================================================================
//  Reportes del Centro STEM — parámetros (puro: sin Prisma ni React).
//  La página y la descarga de Excel leen los mismos parámetros de la URL, así
//  el Excel siempre es exactamente lo que se ve en pantalla.
// =============================================================================

export type TipoReporte = "resumen" | "cursos" | "alumnos" | "asistencia" | "inscripciones" | "clases" | "profesores"

export const TIPOS_REPORTE: { valor: TipoReporte; label: string; descripcion: string }[] = [
  { valor: "resumen", label: "Resumen general", descripcion: "Las cifras principales del periodo y un desglose por clase." },
  { valor: "cursos", label: "Cursos", descripcion: "Cada curso con su horario, cupo, inscritos, clases impartidas y asistencia." },
  { valor: "alumnos", label: "Alumnos", descripcion: "Cada alumno con sus datos, su tutor, sus cursos y su asistencia." },
  { valor: "asistencia", label: "Asistencia por clase impartida", descripcion: "Cada clase que se dio: fecha, curso, asistentes, faltas y porcentaje." },
  { valor: "inscripciones", label: "Inscripciones y bajas", descripcion: "Las inscripciones hechas en el periodo y las que se dieron de baja." },
  { valor: "clases", label: "Por clase", descripcion: "Totales por clase (VEX IQ, Scratch…): cursos, clases, horas, alumnos y asistencia." },
  { valor: "profesores", label: "Por profesor", descripcion: "Totales por profesor: cursos, clases y horas impartidas, alumnos y asistencia." },
]

export type Periodo = "mes" | "anio" | "rango" | "todo"
export const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: "mes", label: "Un mes" },
  { valor: "anio", label: "Un año" },
  { valor: "rango", label: "Entre dos fechas" },
  { valor: "todo", label: "Todo lo capturado" },
]

export type ParametrosReporte = {
  tipo: TipoReporte
  periodo: Periodo
  mes: string // AAAA-MM
  anio: string // AAAA
  desde: string // AAAA-MM-DD
  hasta: string // AAAA-MM-DD
  clase: number | null
  profesor: number | null
}

type Busqueda = Record<string, string | string[] | undefined> | URLSearchParams

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function leerParametros(busqueda: Busqueda, hoy: string): ParametrosReporte {
  const get = (k: string) => {
    const v = busqueda instanceof URLSearchParams ? busqueda.get(k) : busqueda[k]
    return (Array.isArray(v) ? v[0] : v) ?? ""
  }
  const tipo = TIPOS_REPORTE.some((t) => t.valor === get("tipo")) ? (get("tipo") as TipoReporte) : "resumen"
  const periodo = PERIODOS.some((p) => p.valor === get("periodo")) ? (get("periodo") as Periodo) : "mes"
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(get("mes")) ? get("mes") : hoy.slice(0, 7)
  const anio = /^\d{4}$/.test(get("anio")) ? get("anio") : hoy.slice(0, 4)
  let desde = ISO.test(get("desde")) ? get("desde") : `${hoy.slice(0, 7)}-01`
  let hasta = ISO.test(get("hasta")) ? get("hasta") : hoy
  if (desde > hasta) [desde, hasta] = [hasta, desde]
  const id = (k: string) => {
    const n = Number.parseInt(get(k), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return { tipo, periodo, mes, anio, desde, hasta, clase: id("clase"), profesor: id("profesor") }
}

/** Los parámetros como query string (para la URL de la página y la del Excel). */
export function aQuery(p: ParametrosReporte): string {
  const q = new URLSearchParams({ tipo: p.tipo, periodo: p.periodo })
  if (p.periodo === "mes") q.set("mes", p.mes)
  if (p.periodo === "anio") q.set("anio", p.anio)
  if (p.periodo === "rango") {
    q.set("desde", p.desde)
    q.set("hasta", p.hasta)
  }
  if (p.clase) q.set("clase", String(p.clase))
  if (p.profesor) q.set("profesor", String(p.profesor))
  return q.toString()
}

const ultimoDia = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate()
const fechaLarga = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** Fechas que abarca el periodo (inclusive) y cómo se lee. */
export function rangoDe(p: ParametrosReporte): { desde: string; hasta: string; texto: string } {
  if (p.periodo === "mes") {
    const [a, m] = p.mes.split("-").map(Number)
    const nombre = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" })
    return { desde: `${p.mes}-01`, hasta: `${p.mes}-${String(ultimoDia(a, m)).padStart(2, "0")}`, texto: nombre.charAt(0).toUpperCase() + nombre.slice(1) }
  }
  if (p.periodo === "anio") return { desde: `${p.anio}-01-01`, hasta: `${p.anio}-12-31`, texto: `Año ${p.anio}` }
  if (p.periodo === "rango") return { desde: p.desde, hasta: p.hasta, texto: `Del ${fechaLarga(p.desde)} al ${fechaLarga(p.hasta)}` }
  return { desde: "1900-01-01", hasta: "2999-12-31", texto: "Todo lo capturado" }
}

// --- Resultado (lo que se muestra y se exporta) -------------------------------------------

export type TipoColumna = "texto" | "numero" | "fecha" | "porcentaje"
export type ColumnaReporte = { clave: string; titulo: string; tipo?: TipoColumna; ancho?: number }
export type ValorCelda = string | number | null
export type Reporte = {
  titulo: string
  periodo: string
  filtros: string
  metricas: { etiqueta: string; valor: string | number; nota?: string }[]
  columnas: ColumnaReporte[]
  filas: Record<string, ValorCelda>[]
}
