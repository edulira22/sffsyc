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
//   OFICIOS_TOPE_MENSUAL_USD   por defecto 15
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
  valores,
} from "@/lib/oficios/catalogos"

export const MODELO_OFICIOS = process.env.OFICIOS_MODELO?.trim() || "claude-opus-5-5"
const ESFUERZO = (["low", "medium", "high"].includes(process.env.OFICIOS_ESFUERZO ?? "")
  ? process.env.OFICIOS_ESFUERZO
  : "low") as "low" | "medium" | "high"
export const TOPE_MENSUAL_USD = Number(process.env.OFICIOS_TOPE_MENSUAL_USD) > 0
  ? Number(process.env.OFICIOS_TOPE_MENSUAL_USD)
  : 15

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
  "numero_recepcion",
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
  numero_oficio: z.string().describe("Número del oficio impreso por quien lo envía, tal cual aparece. Vacío si no tiene."),
  numero_recepcion: z.string().describe("Número escrito a mano al recibirlo (pluma, junto al sello o arriba a la izquierda). Vacío si no hay."),
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
export const INSTRUCCIONES =`Eres el asistente de captura de la oficialía de partes de la Subdirección de Fortalecimiento Familiar, Social y Comunitario del DIF Municipal de Chihuahua. Recibes la imagen o PDF de un oficio y devuelves sus datos para registrarlo en la bitácora. Una persona revisará tu propuesta antes de guardarla, así que es preferible dejar un campo vacío y marcarlo como dudoso que inventarlo.

Cómo leer cada dato:
- Número de oficio: el que imprime el remitente (p. ej. "UT/DIF/03/2026", "SR/002/2026", "014/DIF/DAS/2026"). Si además hay un número escrito a mano al recibirlo, va en numero_recepcion; no los mezcles.
- Fecha de recepción: la del sello "RECIBIDO". Si no hay sello legible, déjala vacía y anota "Sin sello visible" en la observación.
- Remitente: quien firma, sin inventar nombres. Si firma "en representación de", anótalo en el resumen.
- Asunto: una frase corta y concreta; los detalles van en el resumen.
- Resumen: solo lo que sirve para atenderlo (cuándo, dónde, cuánto, a quién contactar, qué plazo, a qué oficio responde). No repitas el asunto.
- Fechas: siempre AAAA-MM-DD. Si el documento dice solo día y mes, usa el año del documento. Para fechas relativas ("el próximo viernes") toma como referencia la fecha del documento.
- Fecha límite: solo si el documento fija un plazo ("en un término de 5 días hábiles", "a más tardar el…") o pide algo para un evento con fecha; en ese caso usa la fecha del evento. Si no, vacía.
- Requiere respuesta: verdadero si piden algo (espacio, apoyo, información, asistencia, firma) o fijan un plazo; falso si solo informan o agradecen.
- Tipo: solicitud, invitación, informativo, requerimiento (exige información o acción con plazo, p. ej. transparencia o autoridades), respuesta (contesta un oficio nuestro) u otro.
- Prioridad: normal por defecto; alta si el plazo es menor a una semana; urgente solo si el documento lo dice o el plazo es de 3 días o menos.

Área responsable (elige una):
${AREAS_OFICIO.map((a) => `- ${a.valor}: ${a.criterio}`).join("\n")}

Si el documento es parcialmente ilegible, captura lo visible, marca los campos dudosos y escribe "Información parcial por baja legibilidad" en la observación. Si lo que recibes no es un oficio, deja los campos vacíos y explícalo en la observación.`

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

// --- Lectura -----------------------------------------------------------------

export type ResultadoLectura =
  | { ok: true; datos: LecturaOficio; modelo: string; costoUsd: number; paginasPdf: number | null }
  | { ok: false; error: string }

function mensajeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return "La clave de la API de Claude no es válida. Revisa ANTHROPIC_API_KEY."
  }
  if (e instanceof Anthropic.RateLimitError) {
    return "La IA recibió demasiadas solicitudes. Espera un minuto y vuelve a intentar."
  }
  if (e instanceof Anthropic.APIConnectionTimeoutError) {
    return "La IA tardó demasiado en responder. Vuelve a intentar."
  }
  if (e instanceof Anthropic.BadRequestError) {
    return "La IA no pudo procesar el archivo (¿está dañado o protegido?)."
  }
  if (e instanceof Anthropic.APIError) {
    return e.status === 529 || (e.status ?? 0) >= 500
      ? "El servicio de IA está saturado en este momento. Vuelve a intentar en unos minutos."
      : `Error de la IA (${e.status ?? "sin estado"}).`
  }
  return "No se pudo leer el oficio con IA."
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
    return { ok: false, error: "La lectura con IA no está configurada (falta ANTHROPIC_API_KEY). Captura los datos a mano." }
  }
  const gastado = await gastoDelMes()
  if (gastado >= TOPE_MENSUAL_USD) {
    return {
      ok: false,
      error: `Se alcanzó el tope mensual de IA (US$ ${TOPE_MENSUAL_USD.toFixed(2)}). Captura los datos a mano o sube el tope.`,
    }
  }

  let paginasPdf: number | null = null
  let datosIA = params.datos
  if (params.tipo === "application/pdf") {
    const r = await recortarPdf(params.datos)
    datosIA = r.datos
    paginasPdf = r.paginas
  }

  const client = new Anthropic({ timeout: 50_000, maxRetries: 0 })
  const conRespaldo = /^claude-(opus|sonnet|fable)/.test(MODELO_OFICIOS)
  const inicio = Date.now()

  try {
    const resp = await client.beta.messages.parse({
      model: MODELO_OFICIOS,
      max_tokens: 16000,
      system: [{ type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } }],
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
    if (resp.stop_reason === "refusal") error = "La IA no procesó este documento."
    else if (resp.stop_reason === "max_tokens") error = "La respuesta de la IA quedó incompleta."
    else if (!resp.parsed_output) error = "La IA devolvió datos con formato inválido."

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
