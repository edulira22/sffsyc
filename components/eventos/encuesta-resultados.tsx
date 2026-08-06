"use client"

import { useState } from "react"
import { ChevronDown, MessageSquareQuote, Star } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type {
  ResultadoPregunta,
  RespuestaEncuestaListada,
} from "@/lib/data/encuesta-padres"
import { labelDeValor, preguntaPorId } from "@/lib/eventos/encuesta-padres"
import type { TonoOpcion } from "@/lib/eventos/encuesta-padres"

const COLOR_TONO: Record<TonoOpcion, string> = {
  positivo: "bg-agua",
  neutral: "bg-amber-400",
  negativo: "bg-rose-400",
}

function fechaCorta(d: Date) {
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EncuestaResultados({
  preguntas,
  respuestas,
}: {
  preguntas: ResultadoPregunta[]
  respuestas: RespuestaEncuestaListada[]
}) {
  return (
    <Tabs defaultValue="resumen" className="space-y-4">
      <TabsList>
        <TabsTrigger value="resumen">Resultados por pregunta</TabsTrigger>
        <TabsTrigger value="respuestas">
          Respuestas individuales ({respuestas.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="resumen" className="space-y-3">
        {preguntas.map((r) => (
          <TarjetaPregunta key={r.pregunta.id} resultado={r} />
        ))}
      </TabsContent>

      <TabsContent value="respuestas" className="space-y-2">
        {respuestas.length === 0 ? (
          <Vacio />
        ) : (
          respuestas.map((r) => <FilaRespuesta key={r.id} respuesta={r} />)
        )}
      </TabsContent>
    </Tabs>
  )
}

// --- Resultado de una pregunta ----------------------------------------------

function TarjetaPregunta({ resultado }: { resultado: ResultadoPregunta }) {
  const { pregunta: p, respondieron } = resultado

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-sm font-semibold leading-snug text-foreground">
          <span className="text-muted-foreground">{p.numero}.</span> {p.texto}
        </p>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {respondieron} {respondieron === 1 ? "respuesta" : "respuestas"}
        </span>
      </div>

      {respondieron === 0 ? (
        <p className="text-sm text-muted-foreground">Sin respuestas todavía.</p>
      ) : p.tipo === "estrellas" ? (
        <Estrellas resultado={resultado} />
      ) : p.tipo === "texto" ? (
        <Textos resultado={resultado} />
      ) : (
        <Barras resultado={resultado} multiple={p.tipo === "multiple"} />
      )}
    </div>
  )
}

function Barras({
  resultado,
  multiple,
}: {
  resultado: ResultadoPregunta
  multiple: boolean
}) {
  return (
    <div className="space-y-2.5">
      {resultado.distribucion.map((d) => (
        <div key={d.valor}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-foreground">{d.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{d.pct}%</span>{" "}
              <span className="text-xs">({d.cuenta})</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", COLOR_TONO[d.tono])}
              style={{ width: `${d.pct}%` }}
            />
          </div>
        </div>
      ))}
      {multiple && (
        <p className="pt-1 text-xs text-muted-foreground">
          Cada persona puede elegir varias opciones, por eso la suma supera el 100%.
        </p>
      )}
    </div>
  )
}

function Estrellas({ resultado }: { resultado: ResultadoPregunta }) {
  const prom = resultado.promedio ?? 0
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="shrink-0 text-center sm:w-32">
        <p className="text-4xl font-bold tabular-nums text-foreground">{prom}</p>
        <div className="mt-1 flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "size-4",
                n <= Math.round(prom)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">de 5</p>
      </div>

      <div className="flex-1 space-y-1.5">
        {resultado.distribucionEstrellas.map((d) => (
          <div key={d.estrella} className="flex items-center gap-2.5">
            <span className="flex w-8 shrink-0 items-center gap-0.5 text-xs tabular-nums text-muted-foreground">
              {d.estrella}
              <Star className="size-3 fill-amber-400 text-amber-400" />
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {d.pct}% ({d.cuenta})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Textos({ resultado }: { resultado: ResultadoPregunta }) {
  const [todos, setTodos] = useState(false)
  const visibles = todos ? resultado.textos : resultado.textos.slice(0, 5)

  return (
    <div className="space-y-2">
      {visibles.map((t, i) => (
        <div
          key={i}
          className="flex gap-2.5 rounded-lg border-l-2 border-l-gobierno/30 bg-muted/30 px-3 py-2.5"
        >
          <MessageSquareQuote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {t.texto}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t.nombre ? `${t.nombre} · ` : "Anónima · "}
              {fechaCorta(t.fecha)}
            </p>
          </div>
        </div>
      ))}
      {resultado.textos.length > 5 && (
        <button
          type="button"
          onClick={() => setTodos((v) => !v)}
          className="text-xs font-medium text-gobierno hover:underline"
        >
          {todos
            ? "Ver menos"
            : `Ver las ${resultado.textos.length} respuestas`}
        </button>
      )}
    </div>
  )
}

// --- Respuesta individual ----------------------------------------------------

function FilaRespuesta({ respuesta }: { respuesta: RespuestaEncuestaListada }) {
  const [abierta, setAbierta] = useState(false)
  const r = respuesta.respuestas

  const satisfaccion = typeof r.satisfaccionGeneral === "string"
    ? labelDeValor("satisfaccionGeneral", r.satisfaccionGeneral)
    : "—"
  const recomienda = typeof r.recomendaria === "string"
    ? labelDeValor("recomendaria", r.recomendaria)
    : "—"

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium text-foreground">
              {respuesta.nombre ?? "Respuesta anónima"}
            </p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {satisfaccion}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fechaCorta(respuesta.fecha)} · Recomendaría: {recomienda}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            abierta && "rotate-180"
          )}
        />
      </button>

      {abierta && (
        <div className="space-y-3 border-t bg-muted/20 px-4 py-4">
          {Object.entries(r).map(([id, valor]) => {
            const p = preguntaPorId(id)
            if (!p) return null
            let texto: string
            if (Array.isArray(valor)) {
              texto = valor.map((v) => labelDeValor(id, v)).join(", ") || "—"
            } else if (typeof valor === "number") {
              texto = `${valor} de 5`
            } else {
              texto = p.tipo === "texto" ? valor : labelDeValor(id, valor)
            }
            return (
              <div key={id}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {p.numero}. {p.texto}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                  {texto}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Vacio() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
      <p className="font-medium text-foreground">Aún no hay respuestas</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Comparte la liga pública con los padres para empezar a recibirlas.
      </p>
    </div>
  )
}
