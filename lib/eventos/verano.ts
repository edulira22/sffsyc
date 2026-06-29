// =============================================================================
//  Verano DIFertido 2026 — fuente única de verdad del evento.
//  Aquí viven los datos que comparten el formulario de inscripción, el tablero,
//  la configuración de clases y (más adelante) el algoritmo de asignación de
//  grupos. Si cambia una fecha, un grupo o un color, se cambia SOLO aquí.
// =============================================================================

export const EVENTO_VERANO = {
  nombre: "Verano DIFertido 2026",
  sede: "DIF Municipal de Chihuahua",
  // Fechas oficiales del curso (ISO, zona local).
  inicio: "2026-07-20",
  fin: "2026-08-07",
  horaEntrada: "8:00 am",
  // Temporada de inscripciones (lunes a viernes). Abre el lunes 08:00 y
  // cierra al final del viernes; después el aviso se oculta solo.
  inscripcionInicio: "2026-06-29",
  inscripcionFin: "2026-07-03",
} as const

// --- Grupos -----------------------------------------------------------------

export type GrupoId =
  | "botzitos"
  | "robotines"
  | "botix"
  | "turbobots"
  | "megatronix"

export type GrupoVerano = {
  id: GrupoId
  nombre: string
  /** Color institucional del grupo (etiqueta legible). */
  color: string
  /** Color base en HEX para puntos/acentos. */
  hex: string
  /** Rango de edad nominal. El traslape 10–13 lo ajusta el algoritmo. */
  edadMin: number
  edadMax: number
  /** Hora de salida escalonada (del reglamento). */
  salida: string
  /** Clases utilitarias de Tailwind para tarjetas/insignias. */
  claseCard: string
  claseChip: string
}

export const GRUPOS_VERANO: GrupoVerano[] = [
  {
    id: "botzitos",
    nombre: "Botzitos",
    color: "Amarillo",
    hex: "#EAB308",
    edadMin: 5,
    edadMax: 6,
    salida: "1:30 pm",
    claseCard: "border-yellow-300 bg-yellow-50",
    claseChip: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    id: "robotines",
    nombre: "Robotines",
    color: "Verde",
    hex: "#16A34A",
    edadMin: 7,
    edadMax: 8,
    salida: "2:15 pm",
    claseCard: "border-green-300 bg-green-50",
    claseChip: "bg-green-100 text-green-800 border-green-300",
  },
  {
    id: "botix",
    nombre: "Botix",
    color: "Azul eléctrico",
    hex: "#2563EB",
    edadMin: 9,
    edadMax: 9,
    salida: "2:15 pm",
    claseCard: "border-blue-300 bg-blue-50",
    claseChip: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "turbobots",
    nombre: "TurboBots",
    color: "Naranja",
    hex: "#F97316",
    edadMin: 10,
    edadMax: 10,
    salida: "2:15 pm",
    claseCard: "border-orange-300 bg-orange-50",
    claseChip: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    id: "megatronix",
    nombre: "Megatronix",
    color: "Morado / Plata",
    hex: "#7C3AED",
    edadMin: 11,
    edadMax: 12,
    salida: "2:30 pm",
    claseCard: "border-purple-300 bg-purple-50",
    claseChip: "bg-purple-100 text-purple-800 border-purple-300",
  },
]

/**
 * Grupo SUGERIDO según la edad. Es solo una sugerencia para la captura:
 * la asignación final de TurboBots/Megatronix (edades 10–13) se nivela con
 * el algoritmo de reparto, que se ejecuta sobre el padrón completo.
 */
export function grupoSugeridoPorEdad(edad: number | null): GrupoVerano | null {
  if (edad === null || Number.isNaN(edad)) return null
  if (edad <= 6) return GRUPOS_VERANO[0] // botzitos
  if (edad <= 8) return GRUPOS_VERANO[1] // robotines
  if (edad === 9) return GRUPOS_VERANO[2] // botix
  if (edad === 10) return GRUPOS_VERANO[3] // turbobots
  return GRUPOS_VERANO[4] // 11+ megatronix
}

export function grupoPorId(id: string): GrupoVerano | undefined {
  return GRUPOS_VERANO.find((g) => g.id === id)
}

// --- Tallas de playera -------------------------------------------------------

export const TALLAS_VERANO = ["4", "6", "8", "10", "12", "14", "16"] as const

export type TallaVerano = (typeof TALLAS_VERANO)[number]

// --- Documentos requeridos (status por NNA) ----------------------------------
//  Cada documento tiene un id estable (se guarda en BD) y su etiqueta legible.
//  Sirve para el checklist del formulario, el expediente impreso y el tablero
//  de status de documentos de cada niño.

export type DocumentoVerano = { id: string; label: string }

export const DOCUMENTOS_VERANO: DocumentoVerano[] = [
  { id: "acta", label: "Acta de nacimiento" },
  { id: "curp", label: "CURP" },
  { id: "fotos", label: "2 fotografías recientes, tamaño infantil a color" },
  { id: "certificado_medico", label: "Certificado médico reciente" },
  { id: "cartilla", label: "Cartilla de vacunación vigente" },
  { id: "comprobante_domicilio", label: "Comprobante de domicilio reciente" },
  { id: "servicio_medico", label: "Servicio médico" },
  {
    id: "ine_tutores",
    label: "INE de padres o tutores (quienes tengan bajo su cuidado al menor)",
  },
  {
    id: "ine_autorizados",
    label:
      "INE de personas autorizadas para recoger al menor (si los padres/tutores no pueden hacerlo)",
  },
  { id: "reglamento", label: "Reglamento" },
  {
    id: "carta_cancha",
    label: "Carta de autorización para salir a cancha de futbol EFCEMAC",
  },
  { id: "carta_imagen", label: "Carta de autorización de uso de imagen" },
  {
    id: "avisos_privacidad",
    label:
      "Avisos de privacidad simplificado e integral (Inscripción Verano DIFertido 2026)",
  },
]

export const TOTAL_DOCUMENTOS = DOCUMENTOS_VERANO.length

// El recibo de pago cuenta también como requisito (se captura su número).
export const TOTAL_REQUISITOS = TOTAL_DOCUMENTOS + 1

// --- Folio -------------------------------------------------------------------

/** Folio legible y estable derivado del id del expediente: VD26-0001. */
export function folioVerano(id: number): string {
  return `VD26-${String(id).padStart(4, "0")}`
}

// --- Reglamento --------------------------------------------------------------
//  Texto oficial del reglamento del curso. Fuente única de verdad: se muestra
//  en la ventana del formulario y NO se imprime en el expediente.

export const REGLAMENTO_VERANO = {
  reglas: [
    "Respetar la hora de entrada y salida (se debe acudir a todas las clases). Entrada a las 8:00 am / Salida escalonada: Botzitos 1:30 pm; Robotines, Botix y TurboBots 2:15 pm; Megatronix 2:30 pm.",
    "Cuidar y respetar las instalaciones.",
    "Respetar a compañeros, maestros y staff.",
    "Los NNA que reincidan con faltas de respeto a maestros, staff y/o compañeros, quedarán suspendidos(a) de manera definitiva del curso.",
    "Traer ropa cómoda y adecuada para realizar las actividades diarias.",
    "Traer refrigerio (sano y variado), ya que habrá 30 minutos de receso (11:00 am).",
    "Prohibido el uso de celular, tablet y/o audífonos; en caso de que su hijo(a) requiera comunicarle algo, o se presente alguna situación extraordinaria, la coordinadora se comunicará con usted (Claudia 6141166982).",
    "La institución no se hace responsable de objetos perdidos, por ello, marque todas las pertenencias de su hijo(a); habrá una mesa de objetos perdidos, que se instalará a la hora de salida, para que su hijo(a) o usted estén al tanto de revisarla.",
    "Los NNA deberán presentarse en condiciones de salud adecuadas; no se permitirá el acceso si presenta fiebre, tos, moco abundante, vómito, dolor de cabeza, evacuaciones constantes, ronchas, etc., por tal motivo deberá ser atendido por su médico familiar.",
    "En caso de que usted, por motivos ajenos al curso, decida dar de baja a su hijo(a), no podrá ser reembolsado su dinero.",
    "La seguridad de sus hijos es nuestra prioridad. Todas las personas autorizadas para recogerlos, ya sea a la hora de salida o durante las actividades, deberán estar registradas tanto en la solicitud de inscripción como en la credencial del curso. Es OBLIGATORIO que la persona autorizada PRESENTE DICHA CREDENCIAL al staff para realizar la entrega del NNA. Sin la credencial no será posible autorizar la salida.",
  ],
  entradaSalida: [
    "A la hora de entrada, no te estaciones; solo acerca tu vehículo a la puerta principal y nuestro staff ayudará a tu hijo(a) a descender y lo llevará al interior de las instalaciones.",
    "A la hora de salida se hará la misma dinámica, pero debes poner una hoja y/o cartulina en el vidrio de tu vehículo con el nombre y grupo de tu hijo(a); de esta manera lo vocearemos y lo llevaremos hasta la puerta de tu automóvil.",
  ],
  whatsapp:
    "En la hoja de inscripción deberás indicar qué número será ingresado al grupo de WhatsApp, en el cual solamente el/la administrador(a) podrá escribir mensajes, con el objetivo de dar a conocer anuncios y/o pormenores del curso (la administradora será Claudia Arvizo, 6141166982).",
  cierre:
    "He leído atentamente las indicaciones arriba mencionadas, por ello me comprometo a cumplir cada una de ellas y firmo de conformidad.",
} as const
