// =============================================================================
//  Encuesta de satisfacción para padres/tutores — Verano DIFertido 2026.
//  Fuente única de verdad: de aquí se generan el formulario público, la
//  validación, el panel de resultados/KPIs y la exportación a Excel.
//  Si cambia una pregunta o una opción, se cambia SOLO aquí (las respuestas
//  se guardan en una columna JSON, así que no hace falta tocar la base).
// =============================================================================

export const ENCUESTA_PADRES = {
  titulo: "Encuesta de satisfacción",
  intro:
    "La familia DIF agradece tu confianza en este Verano DIFertido. Te invitamos a contestar esta encuesta para ayudarnos a mejorar y poder ofrecerte una experiencia aún más increíble el próximo año.",
  cierre: "¡Gracias por tu tiempo y por confiar en nosotros!",
} as const

/** Tono de una opción: define el color en las gráficas y el cálculo de KPIs. */
export type TonoOpcion = "positivo" | "neutral" | "negativo"

export type OpcionPregunta = {
  valor: string
  label: string
  tono: TonoOpcion
}

export type TipoPregunta =
  /** Una sola opción (radio). */
  | "opcion"
  /** Calificación de 1 a 5 estrellas. */
  | "estrellas"
  /** Varias opciones a la vez (checkbox). */
  | "multiple"
  /** Respuesta abierta. */
  | "texto"

export type PreguntaEncuesta = {
  /** Clave estable con la que se guarda en el JSON de respuestas. */
  id: string
  numero: number
  texto: string
  tipo: TipoPregunta
  requerida: boolean
  opciones?: OpcionPregunta[]
}

export type SeccionEncuesta = {
  id: string
  titulo: string | null
  preguntas: PreguntaEncuesta[]
}

// Atajos para las escalas que se repiten.
const SI_NO: OpcionPregunta[] = [
  { valor: "si", label: "Sí", tono: "positivo" },
  { valor: "no", label: "No", tono: "negativo" },
]

const SI_NO_TALVEZ: OpcionPregunta[] = [
  { valor: "si", label: "Sí", tono: "positivo" },
  { valor: "no", label: "No", tono: "negativo" },
  { valor: "tal_vez", label: "Tal vez", tono: "neutral" },
]

export const SECCIONES_ENCUESTA: SeccionEncuesta[] = [
  {
    id: "general",
    titulo: null,
    preguntas: [
      {
        id: "satisfaccionGeneral",
        numero: 1,
        texto: "¿Qué tan satisfecho(a) estás con la Veraneada en general?",
        tipo: "opcion",
        requerida: true,
        opciones: [
          { valor: "muy_satisfecho", label: "Muy satisfecho", tono: "positivo" },
          { valor: "satisfecho", label: "Satisfecho", tono: "positivo" },
          { valor: "neutral", label: "Neutral", tono: "neutral" },
          { valor: "insatisfecho", label: "Insatisfecho", tono: "negativo" },
          { valor: "muy_insatisfecho", label: "Muy insatisfecho", tono: "negativo" },
        ],
      },
      {
        id: "cumplioExpectativas",
        numero: 2,
        texto: "¿La Veraneada cumplió con tus expectativas?",
        tipo: "opcion",
        requerida: true,
        opciones: [
          { valor: "si", label: "Sí", tono: "positivo" },
          { valor: "parcialmente", label: "Parcialmente", tono: "neutral" },
          { valor: "no", label: "No", tono: "negativo" },
        ],
      },
    ],
  },
  {
    id: "personal",
    titulo: "Sobre el personal y la organización",
    preguntas: [
      {
        id: "atencionPersonal",
        numero: 3,
        texto: "¿Cómo calificarías la atención del personal del DIF durante la Veraneada?",
        tipo: "estrellas",
        requerida: true,
      },
      {
        id: "personalAmable",
        numero: 4,
        texto: "¿El personal fue amable y atento con los asistentes?",
        tipo: "opcion",
        requerida: true,
        opciones: SI_NO,
      },
      {
        id: "organizacionAdecuada",
        numero: 5,
        texto: "¿Consideras que la organización del evento fue adecuada?",
        tipo: "opcion",
        requerida: true,
        opciones: [
          { valor: "muy_adecuada", label: "Muy adecuada", tono: "positivo" },
          { valor: "adecuada", label: "Adecuada", tono: "positivo" },
          { valor: "poco_adecuada", label: "Poco adecuada", tono: "negativo" },
          { valor: "inadecuada", label: "Inadecuada", tono: "negativo" },
        ],
      },
    ],
  },
  {
    id: "actividades",
    titulo: "Actividades y contenido",
    preguntas: [
      {
        id: "gustoActividades",
        numero: 6,
        texto: "¿Qué tanto te gustaron las actividades realizadas durante la Veraneada?",
        tipo: "estrellas",
        requerida: true,
      },
      {
        id: "actividadesApropiadas",
        numero: 7,
        texto: "¿Las actividades fueron apropiadas para la edad de los niños/as participantes?",
        tipo: "opcion",
        requerida: true,
        opciones: [
          { valor: "si", label: "Sí", tono: "positivo" },
          { valor: "no", label: "No", tono: "negativo" },
          { valor: "algunas", label: "Algunas sí, otras no", tono: "neutral" },
        ],
      },
      {
        id: "actividadFavorita",
        numero: 8,
        texto: "¿Cuál fue tu actividad favorita y por qué?",
        tipo: "texto",
        requerida: true,
      },
      {
        id: "modificacionesHorarios",
        numero: 9,
        texto:
          "¿Qué modificaciones consideras necesarias en los horarios de las actividades de fútbol y natación?",
        tipo: "multiple",
        requerida: true,
        opciones: [
          { valor: "quitar_natacion", label: "Quitar horas de natación", tono: "negativo" },
          { valor: "agregar_natacion", label: "Agregar horas de natación", tono: "neutral" },
          { valor: "quitar_futbol", label: "Quitar horas de fútbol", tono: "negativo" },
          { valor: "agregar_futbol", label: "Agregar horas de fútbol", tono: "neutral" },
          { valor: "ninguna", label: "Ninguna modificación", tono: "positivo" },
        ],
      },
    ],
  },
  {
    id: "instalaciones",
    titulo: "Instalaciones y logística",
    preguntas: [
      {
        id: "instalaciones",
        numero: 10,
        texto: "¿Qué te parecieron las instalaciones donde se realizó la veraneada?",
        tipo: "opcion",
        requerida: true,
        opciones: [
          { valor: "muy_adecuadas", label: "Muy adecuadas", tono: "positivo" },
          { valor: "adecuadas", label: "Adecuadas", tono: "positivo" },
          { valor: "inadecuadas", label: "Inadecuadas", tono: "negativo" },
        ],
      },
      {
        id: "senalizacionLimpieza",
        numero: 11,
        texto: "¿Hubo buena señalización, limpieza y seguridad durante el evento?",
        tipo: "opcion",
        requerida: true,
        opciones: [
          { valor: "si", label: "Sí", tono: "positivo" },
          { valor: "no", label: "No", tono: "negativo" },
          { valor: "parcialmente", label: "Parcialmente", tono: "neutral" },
        ],
      },
    ],
  },
  {
    id: "sugerencias",
    titulo: "Sugerencias y mejoras",
    preguntas: [
      {
        id: "repetirActividad",
        numero: 12,
        texto: "¿Te gustaría que el DIF Municipal repita esta actividad el próximo año?",
        tipo: "opcion",
        requerida: true,
        opciones: SI_NO_TALVEZ,
      },
      {
        id: "recomendaria",
        numero: 13,
        texto: "¿Recomendarías esta veraneada a otros padres o tutores?",
        tipo: "opcion",
        requerida: true,
        opciones: SI_NO_TALVEZ,
      },
    ],
  },
  {
    id: "padres",
    titulo: "Preguntas específicas para padres/tutores",
    preguntas: [
      {
        id: "seguridadHijo",
        numero: 14,
        texto: "¿Cómo calificarías la seguridad brindada a tu hijo(a) durante el evento?",
        tipo: "estrellas",
        requerida: true,
      },
      {
        id: "hijoDisfruto",
        numero: 15,
        texto: "¿Consideras que tu hijo(a) disfrutó la experiencia?",
        tipo: "opcion",
        requerida: true,
        opciones: SI_NO,
      },
      {
        id: "seSintioInformado",
        numero: 16,
        texto:
          "¿Te sentiste informado/a durante todo el proceso (inscripción, actividades, horarios)?",
        tipo: "opcion",
        requerida: true,
        opciones: SI_NO,
      },
      {
        id: "aspectosMejora",
        numero: 17,
        texto:
          "¿Qué aspectos consideras que se podrían mejorar para futuras ediciones de Verano DIFertido?",
        tipo: "texto",
        requerida: true,
      },
    ],
  },
]

/** Todas las preguntas en orden, sin la agrupación por sección. */
export const PREGUNTAS_ENCUESTA: PreguntaEncuesta[] = SECCIONES_ENCUESTA.flatMap(
  (s) => s.preguntas
)

export function preguntaPorId(id: string): PreguntaEncuesta | undefined {
  return PREGUNTAS_ENCUESTA.find((p) => p.id === id)
}

/** Etiqueta legible de un valor guardado (para tablas y Excel). */
export function labelDeValor(preguntaId: string, valor: string): string {
  const p = preguntaPorId(preguntaId)
  return p?.opciones?.find((o) => o.valor === valor)?.label ?? valor
}

// --- KPIs --------------------------------------------------------------------

/**
 * Preguntas que alimentan el índice de satisfacción general: se toma el
 * porcentaje de respuestas con tono "positivo" sobre el total.
 */
export const PREGUNTAS_CLAVE_KPI = [
  "satisfaccionGeneral",
  "cumplioExpectativas",
  "recomendaria",
] as const

/** Preguntas de 1 a 5 estrellas (para el promedio general). */
export const PREGUNTAS_ESTRELLAS = PREGUNTAS_ENCUESTA.filter(
  (p) => p.tipo === "estrellas"
).map((p) => p.id)
