// =============================================================================
//  Lectura de oficios con la API de Claude (solo servidor).
//
//  La IA PROPONE los datos; una persona los confirma antes de darlos por
//  buenos (campo `revisado`). Cada llamada queda registrada con sus tokens y
//  su costo en `oficios_lecturas`.
//
//  Cómo se cuida el gasto:
//   - Las imágenes llegan reducidas desde el navegador (≤1568 px por lado, el
//     máximo que el modelo aprovecha) y los PDF se recortan a sus primeras
//     páginas: número, sello, remitente y asunto siempre están al inicio.
//   - Esfuerzo bajo: es extracción, no razonamiento.
//   - Las instrucciones son estables y van en caché (cuestan ~10 % al repetirse
//     dentro de los 5 minutos, p. ej. al capturar un lote).
//   - Salida estructurada compacta (JSON validado), sin texto de más.
//   - Tope mensual en dólares: al alcanzarlo, la captura sigue pero sin IA.
//
//  Configuración (variables de entorno):
//   ANTHROPIC_API_KEY          obligatoria para usar la IA
//   OFICIOS_MODELO             por defecto claude-opus-5-5
//   OFICIOS_ESFUERZO           low | medium | high (por defecto low)
//   OFICIOS_TOPE_MENSUAL_USD   por defecto 15 (red de seguridad, no se muestra)
//   OFICIOS_LIMITE_DIARIO      lecturas por día, por defecto 30 (la "energía")
// =============================================================================

import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { PDFDocument } from "pdf-lib"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  AREAS_OFICIO,
  PRIORIDADES_OFICIO,
  TIPOS_OFICIO,
  hoyChihuahua,
  valores,
} from "@/lib/oficios/catalogos"

export const MODELO_OFICIOS = process.env.OFICIOS_MODELO?.trim() || "claude-opus-5-5"
const ESFUERZO = (["low", "medium", "high"].includes(process.env.OFICIOS_ESFUERZO ?? "")
  ? process.env.OFICIOS_ESFUERZO
  : "low") as "low" | "medium" | "high"
export const TOPE_MENSUAL_USD = Number(process.env.OFICIOS_TOPE_MENSUAL_USD) > 0
  ? Number(process.env.OFICIOS_TOPE_MENSUAL_USD)
  : 15
/** Lecturas permitidas por día. Evita que un clic repetido o un lote enorme gaste de más. */
export const LIMITE_DIARIO = Number(process.env.OFICIOS_LIMITE_DIARIO) > 0 ? Number(process.env.OFICIOS_LIMITE_DIARIO) : 30

export const MENSAJE_CANSADO = "Lirabot está cansado, espera hasta mañana."

/** Páginas de un PDF que se envían a la IA. */
const PAGINAS_PDF_IA = 2

/** USD por millón de tokens (entrada, salida, lectura de caché). */
const PRECIOS: Record<string, { entrada: number; salida: number; cache: number }> = {
  "claude-opus-5-5": { entrada: 4, salida: 20, cache: 0.2 },
  "claude-sonnet-5-5": { entrada: 2, salida: 10, cache: 0.2 },
  "claude-haiku-5-5": { entrada: 0.1, salida: 0.5, cache: 0.01 },
  "claude-opus-4-8": { entrada: 5, salida: 25, cache: 0.5 },
}

export function iaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

// --- Esquema de la respuesta -------------------------------------------------

const CAMPOS_LEIDOS = [
  "numero_oficio",
  "fecha_documento",
  "fecha_recepcion",
  "remitente",
  "cargo_remitente",
  "dependencia",
  "dirigido_a",
  "asunto",
  "fecha_limite",
] as const

export const EsquemaLectura = z.object({
  numero_oficio: z.string().describe("Número del oficio impreso por quien lo envía, tal cual aparece. Nunca un número escrito a mano al recibirlo. Vacío si no tiene."),
  fecha_documento: z.string().describe("Fecha del documento, AAAA-MM-DD. Vacío si no aparece."),
  fecha_recepcion: z.string().describe("Fecha del sello de RECIBIDO, AAAA-MM-DD. Vacío si no hay sello legible."),
  remitente: z.string().describe("Persona que firma, con su título si lo trae (Lic., Mtra.). Si no hay persona, la institución."),
  cargo_remitente: z.string().describe("Cargo de quien firma. Vacío si no aparece."),
  dependencia: z.string().describe("Dependencia, asociación o área que envía el oficio."),
  dirigido_a: z.string().describe("Nombre y/o cargo de a quién va dirigido."),
  tipo: z.enum(valores(TIPOS_OFICIO)),
  asunto: z.string().describe("Qué se pide o informa, en máximo 12 palabras, empezando con verbo (Solicita, Invita, Informa…)."),
  resumen: z.string().describe("Datos para atenderlo: fechas, horarios, sedes, montos, teléfonos, plazos y folios de referencia. Una o dos oraciones; vacío si no hay."),
  area_responsable: z.enum(valores(AREAS_OFICIO)),
  prioridad: z.enum(valores(PRIORIDADES_OFICIO)),
  requiere_respuesta: z.boolean(),
  fecha_limite: z.string().describe("AAAA-MM-DD. Plazo explícito para responder o, si piden algo para un evento, la fecha del evento. Vacío si no hay."),
  campos_dudosos: z.array(z.enum(CAMPOS_LEIDOS)).describe("Campos que no se pudieron leer con certeza."),
  observacion: z.string().describe("Nota breve solo si hace falta: \"Sin sello visible\", \"Información parcial por baja legibilidad\", etc."),
})

export type LecturaOficio = z.infer<typeof EsquemaLectura>

// Instrucciones estables (no incluyen la fecha del día, para que la caché sirva).
export const INSTRUCCIONES = `Eres Lirabot, el asistente de captura de la oficialía de partes de la Subdirección de Fortalecimiento Familiar, Social y Comunitario del DIF Municipal de Chihuahua. Recibes la imagen o PDF de un oficio y devuelves sus datos para registrarlo en la bitácora. Una persona revisará tu propuesta antes de guardarla, así que es preferible dejar un campo vacío y marcarlo como dudoso que inventarlo.

Contexto de la Subdirección:
- Opera la red municipal de Centros Comunitarios y CEDEFAM (Centros de Desarrollo Familiar), el Centro STEM y otros espacios donde se imparten clases, cursos y talleres. Por eso muchos oficios piden prestar un espacio, un auditorio o mobiliario, o proponen impartir cursos (ICATECH, universidades, institutos municipales, dependencias).
- Se vincula con asociaciones civiles: recibe sus proyectos, convenios, informes de actividades o de gastos y sus solicitudes de apoyo.
- Atiende tareas internas del DIF Municipal: enlaces, reportes, formatos, lineamientos, comités, temas de personal, compras, vehículos e inventarios, y las solicitudes de información de la Unidad de Transparencia.
- Los oficios llegan de dependencias municipales y estatales, escuelas, asociaciones, comités de vecinos, regidores y ciudadanos. Suelen ir dirigidos a la Presidencia del DIF Municipal, a la Dirección General o a la Subdirección; aunque vayan dirigidos a otra persona, la Subdirección los registra porque le toca atenderlos o canalizarlos.

Cómo leer cada dato:
- Número de oficio: el que imprime el remitente (p. ej. "UT/DIF/03/2026", "SR/002/2026", "014/DIF/DAS/2026"). Ignora los números escritos a mano al recibirlo y la hora del sello: no se capturan.
- Fecha de recepción: la del sello "RECIBIDO". Si no hay sello legible, déjala vacía y anota "Sin sello visible" en la observación.
- Remitente: quien firma, sin inventar nombres. Si firma "en representación de", anótalo en el resumen. Si no se ve la firma, deja el remitente vacío y pon la institución en dependencia.
- Asunto: una frase corta que empiece con verbo en presente y diga qué y dónde ("Solicita el auditorio del CEDEFAM Punta Oriente para un curso de panadería", "Invita a la entrega simbólica de becas", "Requiere información sobre programas sociales"). Los detalles van en el resumen.
- Resumen: solo lo que sirve para atenderlo, en una o dos oraciones: cuándo (dd/mm/aaaa y horario "de 15:00 a 19:00 h"), dónde, cuántas personas, montos ("$8,000.00"), plazo, a qué oficio responde y un contacto si lo hay. No repitas el asunto.
- Fechas: siempre AAAA-MM-DD. Si el documento dice solo día y mes, usa el año del documento. Para fechas relativas ("el próximo viernes") toma como referencia la fecha del documento.
- Fecha límite: solo si el documento fija un plazo ("en un término de 5 días hábiles", "a más tardar el…") o pide algo para un evento con fecha; en ese caso usa la fecha del evento. Si no, vacía.
- Requiere respuesta: verdadero si piden algo (espacio, apoyo, información, asistencia, firma) o fijan un plazo; falso si solo informan, agradecen o es una circular.
- Prioridad: normal por defecto; alta si el plazo es menor a una semana; urgente solo si el documento lo dice o el plazo es de 3 días o menos.

Tipo (elige uno):
- solicitud: piden algo (espacio, apoyo, donación, autorización, colaboración).
- invitacion: invitan a un evento, ceremonia, sesión o capacitación.
- informativo: avisan algo puntual, entregan un informe o agradecen.
- circular: comunicado general dirigido a varias áreas o a todo el personal (lineamientos, políticas, avisos institucionales, calendarios, cambios de horario); suele decir "Circular" o ir dirigido "A todo el personal" o "A titulares de área".
- requerimiento: exigen información o una acción con plazo (Unidad de Transparencia, órganos de control, autoridades, CEDH).
- respuesta: contestan un oficio que nosotros enviamos ("en respuesta a su oficio…").
- otro: nada de lo anterior.

Área responsable (elige una):
${AREAS_OFICIO.map((a) => `- ${a.valor}: ${a.criterio}`).join("\n")}

Cómo desempatar áreas:
- Si piden usar un centro comunitario, CEDEFAM, auditorio o instalación, es centros_comunitarios aunque lo pida una asociación civil o una dependencia.
- Si una asociación civil pide dinero, presenta un proyecto, un convenio o un informe, es asociaciones_civiles.
- Si viene de la Unidad de Transparencia o es una solicitud de acceso a la información, es transparencia (tipo requerimiento).
- Nómina, personal, compras, pagos, limpieza, mantenimiento, vehículos, mobiliario o presupuesto: administrativo.
- Lo demás que pida una acción de oficina o una resolución (designar enlaces, enviar información, llenar formatos, comités, circulares, invitaciones institucionales, peticiones de apoyos en especie de ciudadanos, regidores o escuelas): secretaria_tecnica.
- Usa por_definir solo si de verdad no se entiende de qué trata.

Si el documento es parcialmente ilegible, captura lo visible, marca los campos dudosos y escribe "Información parcial por baja legibilidad" en la observación. Si lo que recibes no es un oficio, deja los campos vacíos y explícalo en la observación.`

/**
 * Nombres de los centros registrados, para que Lirabot reconozca de qué
 * espacio habla el oficio. Cambian muy rara vez, así que la caché se mantiene.
 */
async function contextoCentros(): Promise<string> {
  try {
    const centros = await prisma.centro.findMany({ where: { estatus: "activo" }, select: { nombre: true }, orderBy: { nombre: "asc" } })
    if (centros.length === 0) return ""
    return `\n\nCentros de la Subdirección (para reconocerlos aunque el oficio los escriba distinto): ${centros.map((c) => c.nombre).join("; ")}.`
  } catch {
    return ""
  }
}

// --- Preparación del archivo -------------------------------------------------

/** Deja solo las primeras páginas de un PDF. Si no se puede, manda el original. */
export async function recortarPdf(bytes: Uint8Array): Promise<{ datos: Uint8Array; paginas: number | null }> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const total = doc.getPageCount()
    if (total <= PAGINAS_PDF_IA) return { datos: bytes, paginas: total }
    const nuevo = await PDFDocument.create()
    const copias = await nuevo.copyPages(doc, Array.from({ length: PAGINAS_PDF_IA }, (_, i) => i))
    copias.forEach((p) => nuevo.addPage(p))
    return { datos: await nuevo.save(), paginas: total }
  } catch {
    return { datos: bytes, paginas: null }
  }
}

function bloqueArchivo(tipo: string, datos: Uint8Array): Anthropic.Beta.BetaContentBlockParam {
  const data = Buffer.from(datos).toString("base64")
  if (tipo === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
  }
  const media = (["image/jpeg", "image/png", "image/webp"].includes(tipo) ? tipo : "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
  return { type: "image", source: { type: "base64", media_type: media, data } }
}

// --- Gasto -------------------------------------------------------------------

function costoUsd(modelo: string, u: Anthropic.Beta.BetaUsage): number {
  const p = PRECIOS[modelo] ?? PRECIOS["claude-opus-5-5"]
  const cacheEscritura = u.cache_creation_input_tokens ?? 0
  const cacheLectura = u.cache_read_input_tokens ?? 0
  return (
    (u.input_tokens * p.entrada +
      u.output_tokens * p.salida +
      cacheLectura * p.cache +
      cacheEscritura * p.entrada * 1.25) /
    1_000_000
  )
}

/** Gasto estimado de la IA en el mes en curso (UTC). */
export async function gastoDelMes(): Promise<number> {
  const ahora = new Date()
  const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1))
  const r = await prisma.oficioLectura.aggregate({
    _sum: { costoUsd: true },
    where: { createdAt: { gte: inicio } },
  })
  return r._sum.costoUsd ?? 0
}

/** Lecturas hechas hoy (día de Chihuahua, UTC−6). */
export async function lecturasDeHoy(): Promise<number> {
  const inicio = new Date(`${hoyChihuahua()}T00:00:00-06:00`)
  return prisma.oficioLectura.count({ where: { createdAt: { gte: inicio } } })
}

/** Energía de Lirabot para hoy: cuántas lecturas le quedan. */
export async function energiaLirabot() {
  const usadas = await lecturasDeHoy()
  return { disponible: iaDisponible(), usadas, limite: LIMITE_DIARIO, restantes: Math.max(0, LIMITE_DIARIO - usadas) }
}

// --- Lectura -----------------------------------------------------------------

export type ResultadoLectura =
  | { ok: true; datos: LecturaOficio; modelo: string; costoUsd: number; paginasPdf: number | null }
  | { ok: false; error: string }

function mensajeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return "La clave de Lirabot no es válida. Revisa ANTHROPIC_API_KEY."
  }
  if (e instanceof Anthropic.RateLimitError) {
    return "Lirabot recibió demasiadas solicitudes. Espera un minuto y vuelve a intentar."
  }
  if (e instanceof Anthropic.APIConnectionTimeoutError) {
    return "Lirabot tardó demasiado en responder. Vuelve a intentar."
  }
  if (e instanceof Anthropic.BadRequestError) {
    return "Lirabot no pudo procesar el archivo (¿está dañado o protegido?)."
  }
  if (e instanceof Anthropic.APIError) {
    return e.status === 529 || (e.status ?? 0) >= 500
      ? "Lirabot está saturado en este momento. Vuelve a intentar en unos minutos."
      : `Error de Lirabot (${e.status ?? "sin estado"}).`
  }
  return "Lirabot no pudo leer el oficio."
}

/**
 * Lee un oficio con Claude y devuelve los datos propuestos. Registra la
 * llamada (con su costo) aunque falle. No escribe en el oficio: eso lo decide
 * quien llama.
 */
export async function leerOficioConClaude(params: {
  oficioId: number
  tipo: string
  datos: Uint8Array
}): Promise<ResultadoLectura> {
  if (!iaDisponible()) {
    return { ok: false, error: "Lirabot no está configurado (falta ANTHROPIC_API_KEY). Captura los datos a mano." }
  }
  const [usadasHoy, gastado] = await Promise.all([lecturasDeHoy(), gastoDelMes()])
  if (usadasHoy >= LIMITE_DIARIO || gastado >= TOPE_MENSUAL_USD) {
    return { ok: false, error: MENSAJE_CANSADO }
  }

  let paginasPdf: number | null = null
  let datosIA = params.datos
  if (params.tipo === "application/pdf") {
    const r = await recortarPdf(params.datos)
    datosIA = r.datos
    paginasPdf = r.paginas
  }

  const sistema = INSTRUCCIONES + (await contextoCentros())
  const client = new Anthropic({ timeout: 50_000, maxRetries: 0 })
  const conRespaldo = /^claude-(opus|sonnet|fable)/.test(MODELO_OFICIOS)
  const inicio = Date.now()

  try {
    const resp = await client.beta.messages.parse({
      model: MODELO_OFICIOS,
      max_tokens: 16000,
      system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
      output_config: { effort: ESFUERZO, format: betaZodOutputFormat(EsquemaLectura) },
      messages: [
        {
          role: "user",
          content: [
            bloqueArchivo(params.tipo, datosIA),
            { type: "text", text: "Registra este oficio." },
          ],
        },
      ],
      // Si el modelo declinara la solicitud, la API la reintenta con otro
      // modelo dentro de la misma llamada (solo Opus/Sonnet/Fable lo admiten).
      ...(conRespaldo
        ? { betas: ["server-side-fallback-2026-07-01" as Anthropic.Beta.AnthropicBeta], fallbacks: "default" as const }
        : {}),
    })

    const costo = costoUsd(resp.model, resp.usage)
    const base = {
      oficioId: params.oficioId,
      modelo: resp.model,
      tokensEntrada: resp.usage.input_tokens,
      tokensSalida: resp.usage.output_tokens,
      tokensCacheLectura: resp.usage.cache_read_input_tokens ?? 0,
      tokensCacheEscritura: resp.usage.cache_creation_input_tokens ?? 0,
      costoUsd: costo,
      duracionMs: Date.now() - inicio,
    }

    let error = ""
    if (resp.stop_reason === "refusal") error = "Lirabot no procesó este documento."
    else if (resp.stop_reason === "max_tokens") error = "La respuesta de Lirabot quedó incompleta."
    else if (!resp.parsed_output) error = "Lirabot devolvió datos con formato inválido."

    await prisma.oficioLectura.create({ data: { ...base, exito: !error, error } })
    if (error || !resp.parsed_output) return { ok: false, error: error || "Sin datos." }

    return { ok: true, datos: resp.parsed_output, modelo: resp.model, costoUsd: costo, paginasPdf }
  } catch (e) {
    const error = mensajeError(e)
    await prisma.oficioLectura.create({
      data: {
        oficioId: params.oficioId,
        modelo: MODELO_OFICIOS,
        exito: false,
        error: e instanceof Error ? `${error} · ${e.message}`.slice(0, 500) : error,
        duracionMs: Date.now() - inicio,
      },
    })
    return { ok: false, error }
  }
}
