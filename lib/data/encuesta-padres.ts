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
  textos: { texto: string; fecha: Date; nombre: string | null }[]
}

/** Una pregunta cerrada, puntuada de 0 a 100 para poder rankearlas entre sí. */
export type PreguntaPuntuada = {
  preguntaId: string
  numero: number
  texto: string
  /** 0–100. En preguntas de opción es el % positivo; en estrellas, la escala normalizada. */
  puntaje: number
  respondieron: number
}

export type DimensionEstrellas = {
  id: string
  etiqueta: string
  promedio: number | null
}

export type KpisEncuesta = {
  total: number
  /** Inscritos activos al curso, para calcular la tasa de participación. */
  inscritosActivos: number
  /** % de familias inscritas que contestaron la encuesta. */
  tasaRespuesta: number | null

  /** % de respuestas con tono positivo en la satisfacción general. */
  satisfaccion: number | null
  /** % de respuestas con tono negativo en la satisfacción general. */
  detractores: number | null
  /** Índice compuesto 0–100 sobre todas las preguntas cerradas. */
  indiceSatisfaccion: number | null

  /** Promedio de las tres preguntas de estrellas, en escala 1–5. */
  promedioEstrellas: number | null
  /** Cada pregunta de estrellas por separado. */
  dimensiones: DimensionEstrellas[]

  recomendaria: number | null
  repetiria: number | null
  hijoDisfruto: number | null
  seSintioInformado: number | null

  /** Cuántas respuestas llevan nombre y cuántas son anónimas. */
  conNombre: number
  anonimas: number

  ultimaRespuesta: Date | null
  /** Respuestas recibidas por día, de la más antigua a la más reciente. */
  porDia: { fecha: string; etiqueta: string; cuenta: number }[]

  /** Preguntas cerradas mejor y peor evaluadas. */
  fortalezas: PreguntaPuntuada[]
  areasOportunidad: PreguntaPuntuada[]
}

export type ResultadosEncuesta = {
  kpis: KpisEncuesta
  preguntas: ResultadoPregunta[]
}

function pct(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100)
}

function redondear1(n: number): number {
  return Math.round(n * 10) / 10
}

/** % de respuestas con alguno de los valores dados, sobre quienes respondieron. */
function pctValor(
  filas: RespuestasEncuesta[],
  preguntaId: string,
  valores: string[]
): number | null {
  const respuestas = filas
    .map((r) => r[preguntaId])
    .filter((v): v is string => typeof v === "string" && v.length > 0)
  if (respuestas.length === 0) return null
  return pct(respuestas.filter((v) => valores.includes(v)).length, respuestas.length)
}

export async function obtenerResultadosEncuesta(): Promise<ResultadosEncuesta> {
  const [filas, inscritosActivos] = await Promise.all([
    prisma.encuestaPadresVerano.findMany({
      orderBy: { createdAt: "desc" },
      select: { nombre: true, respuestas: true, createdAt: true },
    }),
    prisma.inscripcionVerano.count({ where: { estatus: "activa" } }),
  ])

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
          : redondear1(valores.reduce((a, b) => a + b, 0) / valores.length)
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
        nombre: f.nombre?.trim() || null,
      }))
      .filter((t) => t.texto.length > 0)

    base.respondieron = textos.length
    base.textos = textos
    return base
  })

  // --- Puntaje 0–100 por pregunta cerrada (para rankear fortalezas/debilidades) ---
  // Las de opción usan el % positivo; las de estrellas normalizan 1–5 → 0–100.
  // La pregunta de opción múltiple (horarios) es operativa, no de satisfacción:
  // se excluye del ranking y del índice.
  const puntuadas: PreguntaPuntuada[] = preguntas
    .filter((r) => r.respondieron > 0)
    .flatMap((r) => {
      const p = r.pregunta
      if (p.tipo === "opcion") {
        const positivos = r.distribucion
          .filter((d) => d.tono === "positivo")
          .reduce((a, d) => a + d.cuenta, 0)
        return [
          {
            preguntaId: p.id,
            numero: p.numero,
            texto: p.texto,
            puntaje: pct(positivos, r.respondieron),
            respondieron: r.respondieron,
          },
        ]
      }
      if (p.tipo === "estrellas" && r.promedio !== null) {
        return [
          {
            preguntaId: p.id,
            numero: p.numero,
            texto: p.texto,
            puntaje: Math.round(((r.promedio - 1) / 4) * 100),
            respondieron: r.respondieron,
          },
        ]
      }
      return []
    })

  const ordenadas = [...puntuadas].sort((a, b) => b.puntaje - a.puntaje)

  // --- Respuestas por día ---
  const cuentasDia = new Map<string, number>()
  for (const f of filas) {
    const iso = f.createdAt.toISOString().slice(0, 10)
    cuentasDia.set(iso, (cuentasDia.get(iso) ?? 0) + 1)
  }
  const porDia = Array.from(cuentasDia.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, cuenta]) => ({
      fecha,
      etiqueta: new Date(`${fecha}T12:00:00`).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      }),
      cuenta,
    }))

  // --- KPIs ---
  const promediosEstrellas = preguntas
    .filter((r) => PREGUNTAS_ESTRELLAS.includes(r.pregunta.id) && r.promedio !== null)
    .map((r) => r.promedio as number)

  const ETIQUETAS_DIMENSION: Record<string, string> = {
    atencionPersonal: "Atención del personal",
    gustoActividades: "Actividades",
    seguridadHijo: "Seguridad",
  }

  const conNombre = filas.filter((f) => (f.nombre?.trim() ?? "").length > 0).length

  const kpis: KpisEncuesta = {
    total,
    inscritosActivos,
    tasaRespuesta: inscritosActivos === 0 ? null : pct(total, inscritosActivos),

    satisfaccion: pctValor(respuestas, "satisfaccionGeneral", [
      "muy_satisfecho",
      "satisfecho",
    ]),
    detractores: pctValor(respuestas, "satisfaccionGeneral", [
      "insatisfecho",
      "muy_insatisfecho",
    ]),
    indiceSatisfaccion:
      puntuadas.length === 0
        ? null
        : Math.round(
            puntuadas.reduce((a, p) => a + p.puntaje, 0) / puntuadas.length
          ),

    promedioEstrellas:
      promediosEstrellas.length === 0
        ? null
        : redondear1(
            promediosEstrellas.reduce((a, b) => a + b, 0) / promediosEstrellas.length
          ),
    dimensiones: PREGUNTAS_ESTRELLAS.map((id) => ({
      id,
      etiqueta: ETIQUETAS_DIMENSION[id] ?? id,
      promedio: preguntas.find((r) => r.pregunta.id === id)?.promedio ?? null,
    })),

    recomendaria: pctValor(respuestas, "recomendaria", ["si"]),
    repetiria: pctValor(respuestas, "repetirActividad", ["si"]),
    hijoDisfruto: pctValor(respuestas, "hijoDisfruto", ["si"]),
    seSintioInformado: pctValor(respuestas, "seSintioInformado", ["si"]),

    conNombre,
    anonimas: total - conNombre,

    ultimaRespuesta: filas[0]?.createdAt ?? null,
    porDia,

    fortalezas: ordenadas.slice(0, 3),
    areasOportunidad: [...ordenadas].reverse().slice(0, 3),
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
    nombre: f.nombre?.trim() || null,
    respuestas: f.respuestas as RespuestasEncuesta,
  }))
}

export type RespuestaEncuestaListada = Awaited<
  ReturnType<typeof listarRespuestasEncuesta>
>[number]
