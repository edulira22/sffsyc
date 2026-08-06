import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  Gauge,
  Heart,
  MessagesSquare,
  Megaphone,
  Rocket,
  Star,
  ThumbsUp,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import {
  obtenerResultadosEncuesta,
  listarRespuestasEncuesta,
  type KpisEncuesta,
} from "@/lib/data/encuesta-padres"
import { EVENTO_VERANO } from "@/lib/eventos/verano"
import { Button } from "@/components/ui/button"
import { LigaPublica } from "@/components/eventos/liga-publica"
import { EncuestaResultados } from "@/components/eventos/encuesta-resultados"
import { cn } from "@/lib/utils"

export const metadata = { title: "Encuesta de padres — Verano DIFertido" }

/** Color del puntaje según qué tan bien salió (0–100). */
function tonoPuntaje(n: number): string {
  if (n >= 80) return "text-agua"
  if (n >= 60) return "text-amber-600"
  return "text-rose-600"
}

export default async function EncuestaPadresResultadosPage() {
  await requerirSesion()

  const [{ kpis, preguntas }, respuestas] = await Promise.all([
    obtenerResultadosEncuesta(),
    listarRespuestasEncuesta(),
  ])

  return (
    <div className="space-y-5">
      <Link
        href="/eventos/verano-difertido"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Verano DIFertido 2026
      </Link>

      {/* Encabezado del evento */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gobierno via-gobierno to-purple-900 p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-amber-400/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                <Rocket className="size-4" />
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium">
                {EVENTO_VERANO.nombre}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Encuesta de padres y tutores
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Satisfacción del cierre del curso · DIF Municipal de Chihuahua
            </p>
          </div>

          {respuestas.length > 0 && (
            <Button
              asChild
              variant="secondary"
              className="gap-2 bg-white/15 text-white hover:bg-white/25"
            >
              <a href="/api/datos/exportar?entidad=encuesta-padres-verano" download>
                <Download className="size-4" />
                Exportar Excel
              </a>
            </Button>
          )}
        </div>
      </div>

      <LigaPublica
        ruta="/verano/encuesta"
        descripcion="Compártela por WhatsApp con los padres. No requiere iniciar sesión y pueden responder de forma anónima."
      />

      {kpis.total === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <MessagesSquare className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Aún no hay respuestas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte la liga pública de arriba con los padres y tutores. Los KPIs y
            las gráficas aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <>
          <Titulares kpis={kpis} />
          <IndiceYDimensiones kpis={kpis} />
          <FortalezasYOportunidades kpis={kpis} />
          <SecundariosYTimeline kpis={kpis} />
          <EncuestaResultados preguntas={preguntas} respuestas={respuestas} />
        </>
      )}
    </div>
  )
}

// --- KPIs principales --------------------------------------------------------

function Titulares({ kpis }: { kpis: KpisEncuesta }) {
  const tarjetas = [
    {
      icono: MessagesSquare,
      valor: String(kpis.total),
      etiqueta: "Respuestas recibidas",
      pie:
        kpis.tasaRespuesta === null
          ? "Sin inscritos registrados"
          : `${kpis.tasaRespuesta}% de ${kpis.inscritosActivos} familias inscritas`,
      color: "bg-gobierno-50 text-gobierno",
    },
    {
      icono: Gauge,
      valor:
        kpis.indiceSatisfaccion === null ? "—" : `${kpis.indiceSatisfaccion}`,
      etiqueta: "Índice de satisfacción",
      pie: "Promedio de todas las preguntas cerradas, de 0 a 100",
      color: "bg-agua-50 text-agua",
    },
    {
      icono: Star,
      valor: kpis.promedioEstrellas === null ? "—" : `${kpis.promedioEstrellas}`,
      etiqueta: "Calificación promedio",
      pie: "De 5 estrellas, entre atención, actividades y seguridad",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icono: ThumbsUp,
      valor: kpis.recomendaria === null ? "—" : `${kpis.recomendaria}%`,
      etiqueta: "Recomendaría la veraneada",
      pie:
        kpis.repetiria === null
          ? ""
          : `${kpis.repetiria}% quiere que se repita el próximo año`,
      color: "bg-purple-50 text-purple-600",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((t) => {
        const Icono = t.icono
        return (
          <div key={t.etiqueta} className="rounded-xl border bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  t.color
                )}
              >
                <Icono className="size-4" />
              </div>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                {t.etiqueta}
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {t.valor}
            </p>
            {t.pie && (
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                {t.pie}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Índice + dimensiones ----------------------------------------------------

function IndiceYDimensiones({ kpis }: { kpis: KpisEncuesta }) {
  const indice = kpis.indiceSatisfaccion ?? 0

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Barra del índice */}
      <div className="rounded-xl border bg-white p-5 lg:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Índice de satisfacción
        </p>
        <p className={cn("mt-2 text-5xl font-bold tabular-nums", tonoPuntaje(indice))}>
          {kpis.indiceSatisfaccion === null ? "—" : indice}
          <span className="ml-1 text-lg font-medium text-muted-foreground">/100</span>
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-agua to-emerald-400 transition-all"
            style={{ width: `${indice}%` }}
          />
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Combina todas las preguntas cerradas: en las de opción cuenta el
          porcentaje de respuestas positivas, y en las de estrellas la
          calificación llevada a escala de 100.
        </p>
      </div>

      {/* Dimensiones de estrellas */}
      <div className="rounded-xl border bg-white p-5 lg:col-span-2">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Calificación por dimensión
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.dimensiones.map((d) => (
            <div key={d.id}>
              <p className="mb-1.5 text-sm font-medium text-foreground">
                {d.etiqueta}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {d.promedio ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">de 5</span>
              </div>
              <div className="mt-1.5 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "size-3.5",
                      d.promedio !== null && n <= Math.round(d.promedio)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-muted-foreground/25"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Fortalezas y áreas de oportunidad ---------------------------------------

function FortalezasYOportunidades({ kpis }: { kpis: KpisEncuesta }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ListaRanking
        titulo="Lo mejor evaluado"
        descripcion="Las tres preguntas con mejor puntaje. Vale la pena mantenerlo."
        icono={ArrowUpRight}
        colorIcono="bg-agua-50 text-agua"
        items={kpis.fortalezas}
      />
      <ListaRanking
        titulo="Áreas de oportunidad"
        descripcion="Las tres con menor puntaje. Aquí es donde más se puede mejorar."
        icono={TriangleAlert}
        colorIcono="bg-amber-50 text-amber-600"
        items={kpis.areasOportunidad}
      />
    </div>
  )
}

function ListaRanking({
  titulo,
  descripcion,
  icono: Icono,
  colorIcono,
  items,
}: {
  titulo: string
  descripcion: string
  icono: typeof ArrowUpRight
  colorIcono: string
  items: KpisEncuesta["fortalezas"]
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-1 flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            colorIcono
          )}
        >
          <Icono className="size-4" />
        </div>
        <p className="text-sm font-bold text-foreground">{titulo}</p>
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground">{descripcion}</p>

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.preguntaId}>
            <div className="mb-1 flex items-start justify-between gap-3">
              <p className="text-xs leading-snug text-foreground">
                <span className="text-muted-foreground">{p.numero}.</span> {p.texto}
              </p>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  tonoPuntaje(p.puntaje)
                )}
              >
                {p.puntaje}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  p.puntaje >= 80
                    ? "bg-agua"
                    : p.puntaje >= 60
                      ? "bg-amber-400"
                      : "bg-rose-400"
                )}
                style={{ width: `${p.puntaje}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- KPIs secundarios + línea de tiempo --------------------------------------

function SecundariosYTimeline({ kpis }: { kpis: KpisEncuesta }) {
  const chips = [
    {
      icono: Heart,
      valor: kpis.hijoDisfruto === null ? "—" : `${kpis.hijoDisfruto}%`,
      etiqueta: "Su hijo(a) disfrutó",
      color: "text-rose-600",
    },
    {
      icono: Megaphone,
      valor: kpis.seSintioInformado === null ? "—" : `${kpis.seSintioInformado}%`,
      etiqueta: "Se sintió informado",
      color: "text-gobierno",
    },
    {
      icono: TriangleAlert,
      valor: kpis.detractores === null ? "—" : `${kpis.detractores}%`,
      etiqueta: "Insatisfechos",
      color: "text-amber-600",
    },
    {
      icono: UserRound,
      valor: `${kpis.conNombre}`,
      etiqueta: `Con nombre · ${kpis.anonimas} anónimas`,
      color: "text-purple-600",
    },
  ]

  const maxDia = Math.max(1, ...kpis.porDia.map((d) => d.cuenta))

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Indicadores secundarios */}
      <div className="rounded-xl border bg-white p-5 lg:col-span-1">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="size-3.5" />
          Otros indicadores
        </p>
        <div className="grid grid-cols-2 gap-4">
          {chips.map((c) => {
            const Icono = c.icono
            return (
              <div key={c.etiqueta}>
                <Icono className={cn("mb-1 size-4", c.color)} />
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {c.valor}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {c.etiqueta}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Respuestas por día */}
      <div className="rounded-xl border bg-white p-5 lg:col-span-2">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Respuestas por día
        </p>
        {kpis.porDia.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
        ) : (
          <div className="flex h-32 items-end gap-1.5 overflow-x-auto">
            {kpis.porDia.map((d) => (
              <div
                key={d.fecha}
                className="flex min-w-[36px] flex-1 flex-col items-center gap-1.5"
                title={`${d.etiqueta}: ${d.cuenta}`}
              >
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {d.cuenta}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-gobierno to-gobierno/60"
                  style={{ height: `${Math.max(6, (d.cuenta / maxDia) * 80)}px` }}
                />
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                  {d.etiqueta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
