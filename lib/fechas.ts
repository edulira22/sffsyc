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
