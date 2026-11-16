// =============================================================================
//  Centro STEM — fuente única de verdad de catálogos y reglas (TS puro).
//
//  Respuestas cerradas siempre que se pueda (días, grado escolar, parentesco,
//  tipo de escuela, asistencia): así las estadísticas del panel cuadran sin
//  depender de cómo escribió cada quien.
// =============================================================================

type Opcion<T extends string = string> = { valor: T; label: string }

export const label = <T extends string>(lista: Opcion<T>[], valor: string) =>
  lista.find((o) => o.valor === valor)?.label ?? valor

// --- Calendario ----------------------------------------------------------------

export type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom"

export const DIAS_SEMANA: (Opcion<DiaSemana> & { corto: string; js: number })[] = [
  { valor: "lun", label: "Lunes", corto: "Lun", js: 1 },
  { valor: "mar", label: "Martes", corto: "Mar", js: 2 },
  { valor: "mie", label: "Miércoles", corto: "Mié", js: 3 },
  { valor: "jue", label: "Jueves", corto: "Jue", js: 4 },
  { valor: "vie", label: "Viernes", corto: "Vie", js: 5 },
  { valor: "sab", label: "Sábado", corto: "Sáb", js: 6 },
  { valor: "dom", label: "Domingo", corto: "Dom", js: 0 },
]

/** "Lun y Mié · 16:00–18:00" */
export function textoHorario(dias: string[], inicio: string, fin: string): string {
  const nombres = DIAS_SEMANA.filter((d) => dias.includes(d.valor)).map((d) => d.corto)
  const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}` : nombres[0] ?? ""
  return `${lista} · ${inicio}–${fin}`
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Fechas (AAAA-MM-DD) en que toca clase entre inicio y fin, según los días. */
export function fechasDeClase(inicioISO: string, finISO: string, dias: string[]): string[] {
  const numeros = new Set(DIAS_SEMANA.filter((d) => dias.includes(d.valor)).map((d) => d.js))
  const out: string[] = []
  const d = new Date(`${inicioISO}T12:00:00Z`)
  const fin = new Date(`${finISO}T12:00:00Z`)
  for (let i = 0; d <= fin && i < 800; i++) {
    if (numeros.has(d.getUTCDay())) out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/** ¿Dos cursos chocan? Se traslapan en fechas, comparten un día y las horas se cruzan. */
export function seEmpalman(
  a: { inicio: string; fin: string; dias: string[]; horaInicio: string; horaFin: string },
  b: { inicio: string; fin: string; dias: string[]; horaInicio: string; horaFin: string }
): boolean {
  if (a.fin < b.inicio || b.fin < a.inicio) return false
  if (!a.dias.some((d) => b.dias.includes(d))) return false
  return aMinutos(a.horaInicio) < aMinutos(b.horaFin) && aMinutos(b.horaInicio) < aMinutos(a.horaFin)
}

export const horaValida = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
export const minutosEntre = (inicio: string, fin: string) => aMinutos(fin) - aMinutos(inicio)

// --- Estado del curso (se calcula; solo "cancelado" se guarda) --------------------

export type EstadoCurso = "por_iniciar" | "en_curso" | "concluido" | "cancelado"

export const ESTADOS_CURSO: (Opcion<EstadoCurso> & { punto: string })[] = [
  { valor: "en_curso", label: "En curso", punto: "bg-green-600" },
  { valor: "por_iniciar", label: "Por iniciar", punto: "bg-sky-500" },
  { valor: "concluido", label: "Concluido", punto: "bg-slate-400" },
  { valor: "cancelado", label: "Cancelado", punto: "bg-rose-500" },
]

export function estadoCurso(c: { estatus: string; inicio: string; fin: string }, hoy: string): EstadoCurso {
  if (c.estatus === "cancelado") return "cancelado"
  if (hoy < c.inicio) return "por_iniciar"
  if (hoy > c.fin) return "concluido"
  return "en_curso"
}

// --- Alumno ---------------------------------------------------------------------

/** Folio único del alumno, derivado de su id: ST-0001. */
export const folioAlumno = (id: number) => `ST-${String(id).padStart(4, "0")}`

const RX_CURP = /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HMX](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/

export const limpiarCurp = (curp: string) => curp.toUpperCase().replace(/[^A-Z0-9]/g, "")

export function curpValida(curp: string): boolean {
  return RX_CURP.test(limpiarCurp(curp))
}

/**
 * Fecha de nacimiento y sexo que trae la CURP. El siglo sale del carácter 17:
 * dígito = nacido antes del 2000, letra = del 2000 en adelante.
 */
export function datosDeCurp(curp: string): { fechaNacimiento: string; sexo: Sexo } | null {
  const c = limpiarCurp(curp)
  if (!RX_CURP.test(c)) return null
  const siglo = /\d/.test(c[16]) ? 1900 : 2000
  const anio = siglo + Number(c.slice(4, 6))
  const fecha = `${anio}-${c.slice(6, 8)}-${c.slice(8, 10)}`
  const d = new Date(`${fecha}T12:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) return null
  return { fechaNacimiento: fecha, sexo: c[10] as Sexo }
}

export type Sexo = "H" | "M" | "X"
export const SEXOS: Opcion<Sexo>[] = [
  { valor: "M", label: "Mujer" },
  { valor: "H", label: "Hombre" },
  { valor: "X", label: "No binario" },
]

/** Edad cumplida en una fecha dada (ambas AAAA-MM-DD). */
export function edadEn(nacimientoISO: string, fechaISO: string): number {
  const [a, m, d] = nacimientoISO.split("-").map(Number)
  const [ha, hm, hd] = fechaISO.split("-").map(Number)
  let edad = ha - a
  if (hm < m || (hm === m && hd < d)) edad--
  return edad
}

export const GRADOS_ESCOLARES: Opcion[] = [
  { valor: "preescolar", label: "Preescolar" },
  { valor: "1_primaria", label: "1° de primaria" },
  { valor: "2_primaria", label: "2° de primaria" },
  { valor: "3_primaria", label: "3° de primaria" },
  { valor: "4_primaria", label: "4° de primaria" },
  { valor: "5_primaria", label: "5° de primaria" },
  { valor: "6_primaria", label: "6° de primaria" },
  { valor: "1_secundaria", label: "1° de secundaria" },
  { valor: "2_secundaria", label: "2° de secundaria" },
  { valor: "3_secundaria", label: "3° de secundaria" },
  { valor: "preparatoria", label: "Preparatoria" },
  { valor: "universidad", label: "Universidad" },
  { valor: "no_estudia", label: "No estudia" },
]

export const TIPOS_ESCUELA: Opcion[] = [
  { valor: "publica", label: "Pública" },
  { valor: "privada", label: "Privada" },
]

export const PARENTESCOS: Opcion[] = [
  { valor: "madre", label: "Madre" },
  { valor: "padre", label: "Padre" },
  { valor: "abuelo", label: "Abuela / abuelo" },
  { valor: "tio", label: "Tía / tío" },
  { valor: "hermano", label: "Hermana / hermano mayor" },
  { valor: "tutor", label: "Tutor legal" },
  { valor: "otro", label: "Otro" },
]

/** Rangos de edad para el panel. */
export const RANGOS_EDAD: { label: string; min: number; max: number }[] = [
  { label: "5 a 7", min: 0, max: 7 },
  { label: "8 a 10", min: 8, max: 10 },
  { label: "11 a 13", min: 11, max: 13 },
  { label: "14 a 17", min: 14, max: 17 },
  { label: "18 o más", min: 18, max: 200 },
]

// --- Asistencia -------------------------------------------------------------------

export type EstadoAsistencia = "asistio" | "falta" | "justificada"

export const ESTADOS_ASISTENCIA: (Opcion<EstadoAsistencia> & { corto: string; activo: string })[] = [
  { valor: "asistio", label: "Asistió", corto: "A", activo: "bg-green-600 text-white border-green-600" },
  { valor: "falta", label: "Falta", corto: "F", activo: "bg-rose-600 text-white border-rose-600" },
  { valor: "justificada", label: "Justificada", corto: "J", activo: "bg-amber-500 text-white border-amber-500" },
]

/** % de asistencia: justificadas no cuentan en contra. */
export function porcentajeAsistencia(asistio: number, falta: number, justificada: number): number | null {
  const base = asistio + falta
  if (base + justificada === 0) return null
  if (base === 0) return 100
  return Math.round((asistio / base) * 100)
}

// --- Fechas ------------------------------------------------------------------------

/** Hoy en Chihuahua (UTC−6), AAAA-MM-DD. */
export function hoyChihuahua(): string {
  return new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10)
}

export const aISO = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

export function fechaLarga(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
}

export function fechaCorta(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}
