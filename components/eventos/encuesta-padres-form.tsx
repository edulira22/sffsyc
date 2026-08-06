"use client"

import { useMemo, useState, useTransition } from "react"
import { CheckCircle2, Loader2, Star, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  ENCUESTA_PADRES,
  SECCIONES_ENCUESTA,
  PREGUNTAS_ENCUESTA,
  type PreguntaEncuesta,
} from "@/lib/eventos/encuesta-padres"
import {
  valoresInicialesEncuesta,
  type EncuestaPadresInput,
} from "@/lib/schemas/encuesta-padres"
import { enviarEncuestaPadres } from "@/app/verano/encuesta/actions"

export function EncuestaPadresForm() {
  const [valores, setValores] = useState<EncuestaPadresInput>(
    valoresInicialesEncuesta
  )
  const [enviada, setEnviada] = useState(false)
  const [intentado, setIntentado] = useState(false)
  const [pendiente, iniciar] = useTransition()

  const set = (id: string, v: string | number | string[]) =>
    setValores((prev) => ({ ...prev, [id]: v }))

  const estaRespondida = (p: PreguntaEncuesta) => {
    const v = valores[p.id]
    if (p.tipo === "multiple") return Array.isArray(v) && v.length > 0
    if (p.tipo === "estrellas") return typeof v === "number" && v > 0
    return typeof v === "string" && v.trim().length >= (p.tipo === "texto" ? 3 : 1)
  }

  const contestadas = useMemo(
    () => PREGUNTAS_ENCUESTA.filter(estaRespondida).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valores]
  )
  const total = PREGUNTAS_ENCUESTA.length
  const progreso = Math.round((contestadas / total) * 100)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIntentado(true)

    const faltante = PREGUNTAS_ENCUESTA.find((p) => !estaRespondida(p))
    if (faltante) {
      toast.error(`Falta responder la pregunta ${faltante.numero}`)
      document
        .getElementById(`pregunta-${faltante.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    iniciar(async () => {
      const r = await enviarEncuestaPadres(valores)
      if (r.ok) {
        setEnviada(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        toast.error(r.error)
      }
    })
  }

  if (enviada) return <Gracias />

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Introducción */}
      <div className="rounded-2xl border-l-4 border-l-agua bg-white p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {ENCUESTA_PADRES.intro}
        </p>
      </div>

      {SECCIONES_ENCUESTA.map((seccion) => (
        <div key={seccion.id} className="space-y-4">
          {seccion.titulo && (
            <h2 className="px-1 pt-3 text-sm font-bold uppercase tracking-wide text-gobierno">
              {seccion.titulo}
            </h2>
          )}
          {seccion.preguntas.map((p) => (
            <Pregunta
              key={p.id}
              pregunta={p}
              valor={valores[p.id]}
              onChange={(v) => set(p.id, v)}
              error={intentado && !estaRespondida(p)}
            />
          ))}
        </div>
      ))}

      {/* Barra de envío */}
      <div className="sticky bottom-0 -mx-4 border-t bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="mb-2.5 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {contestadas} de {total} respondidas
          </span>
          <span className="font-bold text-agua">{progreso}%</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-agua transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <Button
          type="submit"
          disabled={pendiente}
          className="w-full gap-2 bg-agua py-6 text-base font-semibold hover:bg-agua-600"
        >
          {pendiente ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="size-5" />
              Enviar encuesta
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// --- Pregunta ----------------------------------------------------------------

function Pregunta({
  pregunta: p,
  valor,
  onChange,
  error,
}: {
  pregunta: PreguntaEncuesta
  valor: string | number | string[] | undefined
  onChange: (v: string | number | string[]) => void
  error: boolean
}) {
  return (
    <div
      id={`pregunta-${p.id}`}
      className={cn(
        "scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm transition-colors",
        error && "border-red-300 bg-red-50/40"
      )}
    >
      <p className="mb-4 text-[15px] font-semibold leading-snug text-foreground">
        <span className="text-muted-foreground">{p.numero}.</span> {p.texto}
      </p>

      {p.tipo === "opcion" && (
        <div className="space-y-2">
          {p.opciones?.map((o) => {
            const activa = valor === o.valor
            return (
              <button
                key={o.valor}
                type="button"
                onClick={() => onChange(o.valor)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  activa
                    ? "border-agua bg-agua/5 font-semibold text-agua-700 ring-1 ring-agua"
                    : "border-input hover:border-agua/40 hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    activa ? "border-agua" : "border-muted-foreground/35"
                  )}
                >
                  {activa && <span className="size-2.5 rounded-full bg-agua" />}
                </span>
                {o.label}
              </button>
            )
          })}
        </div>
      )}

      {p.tipo === "multiple" && (
        <div className="space-y-2">
          {p.opciones?.map((o) => {
            const lista = Array.isArray(valor) ? valor : []
            const activa = lista.includes(o.valor)
            return (
              <button
                key={o.valor}
                type="button"
                onClick={() =>
                  onChange(
                    activa
                      ? lista.filter((x) => x !== o.valor)
                      : [...lista, o.valor]
                  )
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  activa
                    ? "border-agua bg-agua/5 font-semibold text-agua-700 ring-1 ring-agua"
                    : "border-input hover:border-agua/40 hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border-2",
                    activa ? "border-agua bg-agua" : "border-muted-foreground/35"
                  )}
                >
                  {activa && <CheckCircle2 className="size-3.5 text-white" />}
                </span>
                {o.label}
              </button>
            )
          })}
          <p className="pt-1 text-xs text-muted-foreground">
            Puedes elegir más de una opción.
          </p>
        </div>
      )}

      {p.tipo === "estrellas" && (
        <Estrellas
          valor={typeof valor === "number" ? valor : 0}
          onChange={onChange}
        />
      )}

      {p.tipo === "texto" && (
        <Textarea
          value={typeof valor === "string" ? valor : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu respuesta…"
          rows={4}
          maxLength={1500}
          className="resize-none text-[15px]"
        />
      )}
    </div>
  )
}

// --- Estrellas ---------------------------------------------------------------

const LEYENDA_ESTRELLAS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"]

function Estrellas({
  valor,
  onChange,
}: {
  valor: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  const activo = hover || valor

  return (
    <div>
      <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} de 5`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-lg p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "size-9 transition-colors",
                n <= activo
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      <p className="mt-1.5 h-4 pl-1 text-xs font-medium text-muted-foreground">
        {activo > 0 && LEYENDA_ESTRELLAS[activo]}
      </p>
    </div>
  )
}

// --- Confirmación ------------------------------------------------------------

function Gracias() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="bg-agua px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white/20">
          <CheckCircle2 className="size-9 text-white" />
        </div>
        <p className="text-xl font-bold text-white">¡Encuesta enviada!</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-white/80">
          {ENCUESTA_PADRES.cierre}
        </p>
      </div>
      <div className="px-6 py-5 text-center">
        <p className="text-sm text-muted-foreground">
          Tus comentarios nos ayudan a mejorar el Verano DIFertido para el próximo
          año. Ya puedes cerrar esta página.
        </p>
      </div>
    </div>
  )
}
