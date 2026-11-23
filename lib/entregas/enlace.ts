// Solo servidor (usa node:crypto y el secreto).
import { createHmac, timingSafeEqual } from "node:crypto"

// Enlace "con llave" al escaneo de una solicitud: abre ese archivo sin iniciar
// sesión (para el Excel que se comparte), pero la llave depende del id y de un
// secreto del servidor, así que no se pueden adivinar los demás cambiando el número.
// Anular la solicitud apaga su enlace.

function secreto(): string {
  const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!s) throw new Error("Falta AUTH_SECRET para firmar enlaces.")
  return s
}

export function llaveEscaneo(id: number): string {
  return createHmac("sha256", secreto()).update(`entregas-escaneo:${id}`).digest("base64url").slice(0, 24)
}

export function llaveValida(id: number, llave: string | null): boolean {
  if (!llave) return false
  const esperada = Buffer.from(llaveEscaneo(id))
  const dada = Buffer.from(llave)
  return dada.length === esperada.length && timingSafeEqual(dada, esperada)
}

export const enlaceEscaneo = (origen: string, id: number) => `${origen}/api/entregas/${id}/archivo?llave=${llaveEscaneo(id)}`
