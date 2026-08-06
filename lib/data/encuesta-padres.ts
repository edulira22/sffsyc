import { prisma } from "@/lib/prisma"
import {
  PREGUNTAS_ENCUESTA,
  PREGUNTAS_ESTRELLAS,
  type PreguntaEncuesta,
  type TonoOpcion,
} from "@/lib/eventos/encuesta-padres"

// Consultas de solo lectura y agregación de la encuesta de padres.
// El volumen es de cientos de respuestas, así que se traen todas y se agregan
// en memoria: mucho más simple que agregar JSONB en SQL y suficientemente rápido.

export type RespuestasEncuesta = Record<string, string | number | string[]>

export type DistribucionOpcion = {
  valor: string
  label: string
  tono: TonoOpcion
  cuenta: number
  pct: number
}

export type DistribucionEstrella = {
  estrella: number
  cuenta: number
  pct: number
}

export type ResultadoPregunta = {
  pregunta: PreguntaEncuesta
  /** Cuántas personas respondieron esta pregunta. */
  respondieron: number
  /** Para tipo "opcion" y "multiple". */
  distribucion: DistribucionOpcion[]
  /** Para tipo "estrellas". */
  promedio: number | null
  distribucionEstrellas: DistribucionEstrella[]
  /** Para tipo "texto", de la más reciente a la más antigua. */
  textos: { texto: string; fecha: Date }[]
}

export type KpisEncuesta = {
  total: number
  /** % de respuestas con tono positivo en la satisfacción general. */
  satisfaccion: number | null
  /** Promedio de las tres preguntas de estrellas, en escala 1–5. */
  promedioEstrellas: number | null
  /** % que respondió "Sí" a recomendar la veraneada. */
  recomendaria: number | null
  /** % que respondió "Sí" a que se repita el próximo año. */
  repetiria: number | null
  ultimaRespuesta: Date | null
}

export type ResultadosEncuesta = {
  kpis: KpisEncuesta
  preguntas: ResultadoPregunta[]
}

function pct(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100)
}

/** % de respuestas con un valor dado sobre el total de quienes respondieron. */
function pctValor(
  filas: RespuestasEncuesta[],
  preguntaId: string,
  valores: string[]
): number | null {
  const respuestas = filas
    .map((r) => r[preguntaId])
    .filter((v): v is string => typeof v === "string" && v.length > 0)
  if (respuestas.length === 0) return null
  const aciertos = respuestas.filter((v) => valores.includes(v)).length
  return pct(aciertos, respuestas.length)
}

export async function obtenerResultadosEncuesta(): Promise<ResultadosEncuesta> {
  const filas = await prisma.encuestaPadresVerano.findMany({
    orderBy: { createdAt: "desc" },
    select: { respuestas: true, createdAt: true },
  })

  const respuestas = filas.map((f) => f.respuestas as RespuestasEncuesta)
  const total = filas.length

  // --- Resultados por pregunta ---
  const preguntas: ResultadoPregunta[] = PREGUNTAS_ENCUESTA.map((p) => {
    const base: ResultadoPregunta = {
      pregunta: p,
      respondieron: 0,
      distribucion: [],
      promedio: null,
      distribucionEstrellas: [],
      textos: [],
    }

    if (p.tipo === "opcion" || p.tipo === "multiple") {
      // En "multiple" cada persona puede marcar varias opciones: la base del
      // porcentaje es la gente que respondió, no el número de marcas.
      const cuentas = new Map<string, number>()
      let respondieron = 0

      for (const r of respuestas) {
        const v = r[p.id]
        if (p.tipo === "multiple") {
          if (!Array.isArray(v) || v.length === 0) continue
          respondieron++
          for (const item of v) {
            if (typeof item === "string") {
              cuentas.set(item, (cuentas.get(item) ?? 0) + 1)
            }
          }
        } else {
          if (typeof v !== "string" || !v) continue
          respondieron++
          cuentas.set(v, (cuentas.get(v) ?? 0) + 1)
        }
      }

      base.respondieron = respondieron
      base.distribucion = (p.opciones ?? []).map((o) => {
        const cuenta = cuentas.get(o.valor) ?? 0
        return {
          valor: o.valor,
          label: o.label,
          tono: o.tono,
          cuenta,
          pct: pct(cuenta, respondieron),
        }
      })
      return base
    }

    if (p.tipo === "estrellas") {
      const valores = respuestas
        .map((r) => r[p.id])
        .filter((v): v is number => typeof v === "number" && v >= 1 && v <= 5)

      base.respondieron = valores.length
      base.promedio =
        valores.length === 0
          ? null
          : Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10
      base.distribucionEstrellas = [5, 4, 3, 2, 1].map((estrella) => {
        const cuenta = valores.filter((v) => v === estrella).length
        return { estrella, cuenta, pct: pct(cuenta, valores.length) }
      })
      return base
    }

    // texto
    const textos = filas
      .map((f) => ({
        texto: String((f.respuestas as RespuestasEncuesta)[p.id] ?? "").trim(),
        fecha: f.createdAt,
      }))
      .filter((t) => t.texto.length > 0)

    base.respondieron = textos.length
    base.textos = textos
    return base
  })

  // --- KPIs ---
  const promediosEstrellas = preguntas
    .filter((r) => PREGUNTAS_ESTRELLAS.includes(r.pregunta.id) && r.promedio !== null)
    .map((r) => r.promedio as number)

  const kpis: KpisEncuesta = {
    total,
    satisfaccion: pctValor(respuestas, "satisfaccionGeneral", [
      "muy_satisfecho",
      "satisfecho",
    ]),
    promedioEstrellas:
      promediosEstrellas.length === 0
        ? null
        : Math.round(
            (promediosEstrellas.reduce((a, b) => a + b, 0) /
              promediosEstrellas.length) *
              10
          ) / 10,
    recomendaria: pctValor(respuestas, "recomendaria", ["si"]),
    repetiria: pctValor(respuestas, "repetirActividad", ["si"]),
    ultimaRespuesta: filas[0]?.createdAt ?? null,
  }

  return { kpis, preguntas }
}

/** Filas crudas para la tabla de respuestas y la exportación a Excel. */
export async function listarRespuestasEncuesta() {
  const filas = await prisma.encuestaPadresVerano.findMany({
    orderBy: { createdAt: "desc" },
  })
  return filas.map((f) => ({
    id: f.id,
    fecha: f.createdAt,
    respuestas: f.respuestas as RespuestasEncuesta,
  }))
}

export type RespuestaEncuestaListada = Awaited<
  ReturnType<typeof listarRespuestasEncuesta>
>[number]
