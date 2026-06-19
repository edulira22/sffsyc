// Tipo de resultado estándar para las Server Actions.
// Permite a la UI mostrar mensajes específicos sin lanzar excepciones.
export type ResultadoAccion =
  | { ok: true; mensaje?: string }
  | { ok: false; error: string }

export const exito = (mensaje?: string): ResultadoAccion => ({ ok: true, mensaje })
export const fallo = (error: string): ResultadoAccion => ({ ok: false, error })
