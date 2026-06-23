// Utilidades de fecha. Las fechas tipo DATE de PostgreSQL llegan como Date en
// medianoche UTC; por eso usamos métodos UTC para no desfasar el día por la
// zona horaria de Chihuahua (UTC-6/-7).

/** Edad en años cumplidos a partir de la fecha de nacimiento. */
export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date()
  let edad = hoy.getUTCFullYear() - fechaNacimiento.getUTCFullYear()
  const mes = hoy.getUTCMonth() - fechaNacimiento.getUTCMonth()
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < fechaNacimiento.getUTCDate())) {
    edad--
  }
  return edad
}

export function esMenorDeEdad(fechaNacimiento: Date): boolean {
  return calcularEdad(fechaNacimiento) < 18
}

/** Formatea una fecha DATE como dd/mm/aaaa usando sus partes UTC. */
export function formatoFecha(fecha: Date): string {
  const d = String(fecha.getUTCDate()).padStart(2, "0")
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0")
  const y = fecha.getUTCFullYear()
  return `${d}/${m}/${y}`
}

/** Cadena YYYY-MM-DD de hoy (para valores por defecto de inputs date). */
export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Extrae la fecha de nacimiento de una CURP (posiciones 4-9: AAMMDD).
 * Heurística de siglo: AA > 24 → 19XX, si no → 20XX.
 * Retorna "YYYY-MM-DD" o null si el formato no es válido.
 */
export function fechaDesCurp(curp: string): string | null {
  if (!curp || curp.length < 10) return null
  const yy = curp.slice(4, 6)
  const mm = curp.slice(6, 8)
  const dd = curp.slice(8, 10)
  if (!/^\d{2}$/.test(yy) || !/^\d{2}$/.test(mm) || !/^\d{2}$/.test(dd)) return null
  const mes = parseInt(mm, 10)
  const dia = parseInt(dd, 10)
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const year = parseInt(yy, 10)
  const fullYear = year > 24 ? 1900 + year : 2000 + year
  return `${fullYear}-${mm}-${dd}`
}

/** Calcula la edad en años a partir de una cadena YYYY-MM-DD (útil en formularios). */
export function edadDeISO(fechaISO: string): number | null {
  if (!fechaISO || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return null
  const [y, m, d] = fechaISO.split("-").map(Number)
  const hoy = new Date()
  let edad = hoy.getFullYear() - y
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) {
    edad--
  }
  return edad >= 0 ? edad : null
}

/** Antigüedad legible desde una fecha (ej. "2 años", "3 meses"). */
export function antiguedad(desde: Date): string {
  const meses =
    (new Date().getUTCFullYear() - desde.getUTCFullYear()) * 12 +
    (new Date().getUTCMonth() - desde.getUTCMonth())
  if (meses < 1) return "Menos de un mes"
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`
  const años = Math.floor(meses / 12)
  return `${años} ${años === 1 ? "año" : "años"}`
}
