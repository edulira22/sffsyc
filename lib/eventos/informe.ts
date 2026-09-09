// =============================================================================
//  Informe de la Sra. Karina — fuente única de verdad del evento.
//  De aquí se generan el formulario público, la validación, el panel de
//  registros y la exportación a Excel.
// =============================================================================

export const EVENTO_INFORME = {
  nombre: "Informe de la Sra. Karina",
  titulo: "Registro de asistencia – Informe de la Sra. Karina",
  descripcion:
    "Registro de colaboradores del DIF Municipal y un familiar invitado. Favor de realizar un solo registro por colaborador.",
  confirmacion:
    "Gracias por tu registro. Tu información ha sido recibida correctamente.",
  institucion: "DIF Municipal de Chihuahua",
  /**
   * Fecha y sede del evento. Se quedan en null hasta que se confirmen: la
   * página solo las muestra cuando tienen valor, para no publicar datos
   * inventados. Formato de fecha: "2026-10-15" (ISO).
   */
  fecha: null as string | null,
  sede: null as string | null,
} as const

// --- Parentesco del invitado -------------------------------------------------

export type ParentescoInforme = {
  valor: string
  label: string
}

export const PARENTESCOS_INFORME: ParentescoInforme[] = [
  { valor: "esposo_pareja", label: "Esposo(a) / Pareja" },
  { valor: "hijo", label: "Hijo(a)" },
  { valor: "madre_padre", label: "Madre / Padre" },
  { valor: "hermano", label: "Hermano(a)" },
  { valor: "otro", label: "Otro familiar" },
]

export const VALORES_PARENTESCO = PARENTESCOS_INFORME.map((p) => p.valor)

/** Etiqueta legible de un parentesco guardado (tablas, Excel). */
export function labelParentesco(valor: string): string {
  return PARENTESCOS_INFORME.find((p) => p.valor === valor)?.label ?? valor
}
