// =============================================================================
//  Lectura de solicitudes de entrega con Lirabot (solo servidor).
//
//  Misma receta que Oficios (lib/oficios/ia.ts): Lirabot PROPONE, una persona
//  confirma; cada llamada queda en entregas_lecturas con su costo, y cuenta
//  para la misma energía diaria y el mismo tope mensual.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  ESFUERZO,
  LIMITE_DIARIO,
  MENSAJE_CANSADO,
  MODELO_OFICIOS,
  TOPE_MENSUAL_USD,
  bloqueArchivo,
  costoUsd,
  gastoDelMes,
  iaDisponible,
  lecturasDeHoy,
  mensajeError,
  recortarPdf,
} from "@/lib/oficios/ia"
import { CATEGORIAS, type Articulo } from "@/lib/entregas/catalogos"

const CAMPOS = ["fecha_solicitud", "fecha_evento", "solicitante", "cargo", "organizacion", "contacto", "cantidades"] as const

function esquema(articulos: Articulo[]) {
  const claves = articulos.map((a) => a.clave) as [string, ...string[]]
  return z.object({
    fecha_solicitud: z.string().describe("Fecha del documento o del sello de recibido, AAAA-MM-DD. Vacío si no aparece."),
    fecha_evento: z.string().describe("Fecha del evento para el que se pide el apoyo, AAAA-MM-DD. Vacío si no se menciona."),
    categoria: z.enum(CATEGORIAS.map((c) => c.valor) as [string, ...string[]]),
    solicitante: z.string().describe("Persona que firma, con su título (Lic., Mtra., Regidora…). Vacío si no se ve."),
    cargo: z.string().describe("Cargo de quien firma. Vacío si no aparece."),
    organizacion: z.string().describe("Asociación, dependencia, escuela, comité o colonia que solicita."),
    resumen: z.string().describe("Qué pide y para qué, en una o dos oraciones: evento, a quién beneficia, cuántos niños o personas, lugar."),
    contacto: z.string().describe("Teléfonos y correos para comunicarse, separados por ' / '. Vacío si no hay."),
    cantidades: z
      .array(z.object({ articulo: z.enum(claves), cantidad: z.number().int().describe("Cantidad que pide; 0 si lo pide sin decir cuánto.") }))
      .describe("Solo los artículos de la lista que pide el documento."),
    campos_dudosos: z.array(z.enum(CAMPOS)).describe("Campos que no se pudieron leer con certeza."),
    observacion: z.string().describe("Nota breve solo si hace falta (ilegible, pide algo fuera de la lista, etc.)."),
  })
}
export type LecturaSolicitud = z.infer<ReturnType<typeof esquema>>

// Estable entre solicitudes (la lista de artículos va en el mensaje), para que la caché sirva.
const INSTRUCCIONES = `Eres Lirabot, el asistente de captura de la Subdirección de Fortalecimiento Familiar, Social y Comunitario del DIF Municipal de Chihuahua. Recibes la imagen o PDF de una solicitud de apoyo en especie (dulces, piñatas, juguetes, cobijas…) que llega para una entrega anual, y devuelves sus datos para registrarla. Una persona revisará tu propuesta, así que es preferible dejar un campo vacío y marcarlo como dudoso que inventarlo.

Cómo leer cada dato:
- Solicitante: quien firma, sin inventar nombres. Organización: la asociación, regiduría, escuela, comité, colonia o dependencia que pide.
- Categoría: asociacion_civil (A.C., fundaciones, clubes), regiduria (regidoras, regidores y sus comisiones), congreso (diputadas, diputados), dependencia (otras dependencias de gobierno), dif (áreas del propio DIF), escuela, comite_vecinos, iglesia, zona_rural (seccionales, ejidos, comunidades), ciudadano (persona sin organización) o por_definir.
- Cantidades: solo de los artículos de la lista que te indican. Si pide "bolsitas de dulces" y la lista tiene un artículo de dulces, usa ese. Si pide algo que no está en la lista, no lo pongas en cantidades: menciónalo en el resumen. Si lo pide sin decir cuánto, cantidad 0 y márcalo dudoso.
- Resumen: qué pide y para qué, con el evento, a quién beneficia, cuántas personas y dónde. No repitas cantidades que ya van en su campo.
- Fechas: AAAA-MM-DD; si solo trae día y mes, usa el año del documento.
- Contacto: todos los teléfonos y correos que aparezcan.

Si el documento es parcialmente ilegible, captura lo visible y explícalo en la observación. Si no es una solicitud, deja los campos vacíos y dilo en la observación.`

export type ResultadoLecturaSolicitud = { ok: true; datos: LecturaSolicitud } | { ok: false; error: string }

export async function leerSolicitudConLirabot(params: {
  solicitudId: number
  tipo: string
  datos: Uint8Array
  articulos: Articulo[]
}): Promise<ResultadoLecturaSolicitud> {
  if (!iaDisponible()) return { ok: false, error: "Lirabot no está configurado. Captura los datos a mano." }
  if (params.articulos.length === 0) return { ok: false, error: "La entrega no tiene artículos; agrégalos antes de leer solicitudes." }
  const [usadasHoy, gastado] = await Promise.all([lecturasDeHoy(), gastoDelMes()])
  if (usadasHoy >= LIMITE_DIARIO || gastado >= TOPE_MENSUAL_USD) return { ok: false, error: MENSAJE_CANSADO }

  const datos = params.tipo === "application/pdf" ? (await recortarPdf(params.datos)).datos : params.datos
  const lista = params.articulos.map((a) => `- ${a.clave}: ${a.nombre}`).join("\n")
  const client = new Anthropic({ timeout: 50_000, maxRetries: 0 })
  const conRespaldo = /^claude-(opus|sonnet|fable)/.test(MODELO_OFICIOS)
  const inicio = Date.now()

  try {
    const resp = await client.beta.messages.parse({
      model: MODELO_OFICIOS,
      max_tokens: 16000,
      system: [{ type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } }],
      output_config: { effort: ESFUERZO, format: betaZodOutputFormat(esquema(params.articulos)) },
      messages: [
        {
          role: "user",
          content: [bloqueArchivo(params.tipo, datos), { type: "text", text: `Artículos de esta entrega:\n${lista}\n\nRegistra esta solicitud.` }],
        },
      ],
      ...(conRespaldo
        ? { betas: ["server-side-fallback-2026-07-01" as Anthropic.Beta.AnthropicBeta], fallbacks: "default" as const }
        : {}),
    })
    let error = ""
    if (resp.stop_reason === "refusal") error = "Lirabot no procesó este documento."
    else if (resp.stop_reason === "max_tokens") error = "La respuesta de Lirabot quedó incompleta."
    else if (!resp.parsed_output) error = "Lirabot devolvió datos con formato inválido."
    await prisma.entregaLectura.create({
      data: {
        solicitudId: params.solicitudId,
        modelo: resp.model,
        tokensEntrada: resp.usage.input_tokens,
        tokensSalida: resp.usage.output_tokens,
        tokensCacheLectura: resp.usage.cache_read_input_tokens ?? 0,
        tokensCacheEscritura: resp.usage.cache_creation_input_tokens ?? 0,
        costoUsd: costoUsd(resp.model, resp.usage),
        exito: !error,
        error,
        duracionMs: Date.now() - inicio,
      },
    })
    if (error || !resp.parsed_output) return { ok: false, error: error || "Sin datos." }
    return { ok: true, datos: resp.parsed_output as LecturaSolicitud }
  } catch (e) {
    const error = mensajeError(e)
    await prisma.entregaLectura.create({
      data: {
        solicitudId: params.solicitudId,
        modelo: MODELO_OFICIOS,
        exito: false,
        error: e instanceof Error ? `${error} · ${e.message}`.slice(0, 500) : error,
        duracionMs: Date.now() - inicio,
      },
    })
    return { ok: false, error }
  }
}
