// Normalización ortográfica automática de la captura. Silenciosa: corrige sin
// avisar para que el expediente quede prolijo aunque el capturista escriba con
// prisa (todo MAYÚSCULAS, todo minúsculas, espacios de más, etc.).

/** "JUAN  de la cruz" → "Juan De La Cruz". Cada palabra con inicial mayúscula. */
export function aTitulo(s: string): string {
  if (!s) return ""
  return s
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX")
    // Primera letra después del inicio o de un separador (espacio, guion, ', /).
    .replace(/(^|[\s\-'/])(\S)/g, (_m, sep, ch) =>
      sep + ch.toLocaleUpperCase("es-MX")
    )
}

/** "HOLA mundo" → "Hola mundo". Primera mayúscula, el resto minúsculas. */
export function aOracion(s: string): string {
  if (!s) return ""
  const t = s.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX")
  return t ? t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1) : t
}

/** Deja solo dígitos: "(614) 116-6982" → "6141166982". */
export function soloDigitos(s: string): string {
  return (s || "").replace(/\D/g, "")
}
