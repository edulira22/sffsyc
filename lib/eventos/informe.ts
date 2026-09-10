// =============================================================================
//  Informe de la Sra. Karina — fuente única de verdad del evento.
//  De aquí se generan el formulario público, la validación, el panel de
//  registros y la exportación a Excel.
// =============================================================================

export const EVENTO_INFORME = {
  nombre: "Informe de la Sra. Karina",
  titulo: "Registro de asistencia – Informe de la Sra. Karina",
  descripcion:
    "Este registro lo realiza únicamente el colaborador del DIF Municipal, una sola vez. Captura en este mismo formulario a todos los familiares que te acompañarán: no envíes un registro por cada uno.",
  /** Recordatorio dentro de la sección de familiares, donde ocurre el error. */
  avisoFamiliares:
    "Agrega aquí a todas las personas que te acompañarán, una por una con el botón de abajo. No hagas un registro nuevo por cada familiar: solo puedes registrarte una vez.",
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

// --- Identidad del colaborador -----------------------------------------------

/**
 * Clave con la que se identifica a un colaborador: su nombre sin acentos, en
 * minúsculas y con los espacios colapsados. Se guarda en una columna aparte
 * con un índice único, de modo que la misma persona no pueda registrarse dos
 * veces aunque escriba su nombre con otra acentuación o mayúsculas.
 */
export function claveColaborador(nombre: string): string {
  return nombre
    .normalize("NFD")
    // \u0300-\u036f = marcas diacriticas combinantes que deja NFD.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

// --- Invitados ---------------------------------------------------------------

/** Un familiar invitado. Se guardan como arreglo JSON en el registro. */
export type InvitadoInforme = {
  nombre: string
  parentesco: string
}

/**
 * Tope de invitados por registro. No es una regla del evento: es un límite
 * sano para un formulario público sin sesión. En la práctica nadie lo alcanza.
 */
export const MAX_INVITADOS = 10

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
