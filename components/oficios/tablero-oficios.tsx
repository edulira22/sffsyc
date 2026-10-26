"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Archive, FileText, Flag, PartyPopper, Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AREAS_OFICIO,
  ESTADOS_OFICIO,
  PRIORIDADES_OFICIO,
  TIPOS_OFICIO,
  diasEntre,
  label,
} from "@/lib/oficios/catalogos"
import type { OficioListado } from "@/lib/data/oficios"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EstadoBadge, PlazoBadge, RevisionBadge } from "@/components/oficios/insignias"

// Vista rápida de la bandeja: lo más reciente, cuántos hay por área y por
// prioridad, y un tablero por columnas. Al tocar un oficio se abre una vista
// previa con lo que dice y su escaneo, sin salir de la página.

type Agrupar = "area" | "prioridad" | "estado"

/** Colores fijos por área: borde de tarjeta, barra y punto. */
const COLOR_AREA: Record<string, { borde: string; barra: string; punto: string; suave: string }> = {
  centros_comunitarios: { borde: "border-l-teal-500", barra: "bg-teal-500", punto: "bg-teal-500", suave: "bg-teal-50 text-teal-800" },
  asociaciones_civiles: { borde: "border-l-indigo-500", barra: "bg-indigo-500", punto: "bg-indigo-500", suave: "bg-indigo-50 text-indigo-800" },
  secretaria_tecnica: { borde: "border-l-violet-500", barra: "bg-violet-500", punto: "bg-violet-500", suave: "bg-violet-50 text-violet-800" },
  administrativo: { borde: "border-l-amber-500", barra: "bg-amber-500", punto: "bg-amber-500", suave: "bg-amber-50 text-amber-800" },
  transparencia: { borde: "border-l-rose-500", barra: "bg-rose-500", punto: "bg-rose-500", suave: "bg-rose-50 text-rose-800" },
  por_definir: { borde: "border-l-slate-400", barra: "bg-slate-400", punto: "bg-slate-400", suave: "bg-slate-100 text-slate-700" },
}
const colorArea = (a: string) => COLOR_AREA[a] ?? COLOR_AREA.por_definir

const COLOR_PRIORIDAD: Record<string, { punto: string; tile: string }> = {
  urgente: { punto: "bg-rose-500", tile: "border-rose-200 bg-rose-50 text-rose-800" },
  alta: { punto: "bg-amber-500", tile: "border-amber-200 bg-amber-50 text-amber-800" },
  normal: { punto: "bg-slate-400", tile: "border-slate-200 bg-white text-slate-700" },
}

const COLOR_ESTADO: Record<string, string> = {
  recibido: "bg-slate-400",
  turnado: "bg-sky-500",
  en_proceso: "bg-amber-500",
  atendido: "bg-emerald-500",
  archivado: "bg-zinc-300",
}

function cuando(iso: string, hoy: string) {
  const d = diasEntre(iso, hoy)
  if (d <= 0) return "Hoy"
  if (d === 1) return "Ayer"
  if (d < 7) return `Hace ${d} días`
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

const recientePrimero = (a: OficioListado, b: OficioListado) =>
  b.fechaRecepcion.localeCompare(a.fechaRecepcion) || b.consecutivo - a.consecutivo

export function TableroOficios({
  oficios,
  hoy,
  filtro,
  quitarFiltro,
  verArchivo,
}: {
  /** Solo lo pendiente (o el subconjunto que eligió el indicador). */
  oficios: OficioListado[]
  hoy: string
  filtro: string
  quitarFiltro: () => void
  verArchivo: () => void
}) {
  const [agrupar, setAgrupar] = useState<Agrupar>("area")
  const [previa, setPrevia] = useState<OficioListado | null>(null)

  const base = useMemo(() => [...oficios].sort(recientePrimero), [oficios])

  const porArea = useMemo(
    () =>
      AREAS_OFICIO.map((a) => ({ ...a, total: base.filter((o) => o.areaResponsable === a.valor).length })).filter((a) => a.total > 0),
    [base]
  )
  const maxArea = Math.max(1, ...porArea.map((a) => a.total))

  const porPrioridad = useMemo(
    () => [...PRIORIDADES_OFICIO].reverse().map((p) => ({ ...p, total: base.filter((o) => o.prioridad === p.valor).length })),
    [base]
  )

  // Solo columnas con oficios: menos ruido a la vista.
  const columnas = useMemo(() => {
    const defs =
      agrupar === "area"
        ? AREAS_OFICIO.map((a) => ({ id: a.valor, titulo: a.label, punto: colorArea(a.valor).punto, de: (o: OficioListado) => o.areaResponsable === a.valor }))
        : agrupar === "prioridad"
          ? [...PRIORIDADES_OFICIO].reverse().map((p) => ({ id: p.valor, titulo: p.label, punto: COLOR_PRIORIDAD[p.valor].punto, de: (o: OficioListado) => o.prioridad === p.valor }))
          : ESTADOS_OFICIO.map((e) => ({ id: e.valor, titulo: e.label, punto: COLOR_ESTADO[e.valor], de: (o: OficioListado) => o.estado === e.valor }))
    return defs.map((d) => ({ ...d, items: base.filter(d.de) })).filter((c) => c.items.length > 0)
  }, [agrupar, base])

  // Con pocos pendientes, el tablero ya los muestra todos; "lo más reciente" solo estorbaría.
  const recientes = base.length > 4 ? base.slice(0, 4) : []

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-white p-0.5">
          {([["area", "Por área"], ["prioridad", "Por prioridad"], ["estado", "Por estado"]] as const).map(([id, t]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAgrupar(id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                agrupar === id ? "bg-gobierno text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {filtro && (
          <button
            type="button"
            onClick={quitarFiltro}
            className="flex items-center gap-1 rounded-full border border-gobierno bg-gobierno-50 px-3 py-1 text-xs font-medium text-gobierno"
          >
            Solo: {filtro} <X className="size-3.5" />
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {base.length} {base.length === 1 ? "oficio" : "oficios"}
        </span>
      </div>

      {base.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white px-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-agua-50 text-agua">
            <PartyPopper className="size-6" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{filtro ? `No hay oficios en "${filtro}".` : "Todo al día: no hay oficios pendientes."}</p>
            <p className="text-sm text-muted-foreground">Lo concluido sigue a la mano en el archivo.</p>
          </div>
          <button
            type="button"
            onClick={filtro ? quitarFiltro : verArchivo}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-sm font-medium hover:bg-muted/50"
          >
            {filtro ? "Ver todos los pendientes" : <><Archive className="size-4" /> Ver el archivo</>}
          </button>
        </div>
      ) : (
        <>
          {/* Lo más reciente */}
          {recientes.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold text-gobierno">Lo más reciente</h2>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {recientes.map((o) => (
                  <TarjetaOficio key={o.id} o={o} hoy={hoy} grande onClick={() => setPrevia(o)} />
                ))}
              </div>
            </section>
          )}

          {/* Distribución */}
          <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-3 text-sm font-bold text-gobierno">Por área</h2>
              <ul className="space-y-2.5">
                {porArea.map((a) => (
                  <li key={a.valor}>
                    <button type="button" onClick={() => setAgrupar("area")} className="block w-full text-left">
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <span className={cn("size-2.5 rounded-full", colorArea(a.valor).punto)} />
                          {a.label}
                        </span>
                        <b className="tabular-nums text-foreground">{a.total}</b>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", colorArea(a.valor).barra)} style={{ width: `${(a.total / maxArea) * 100}%` }} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-3 text-sm font-bold text-gobierno">Por prioridad</h2>
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                {porPrioridad.map((p) => (
                  <button
                    key={p.valor}
                    type="button"
                    onClick={() => setAgrupar("prioridad")}
                    className={cn(
                      "flex flex-col rounded-lg border px-3 py-2 text-left lg:flex-row lg:items-center lg:justify-between",
                      COLOR_PRIORIDAD[p.valor].tile,
                      p.total === 0 && "opacity-50"
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Flag className="size-3.5" /> {p.label}
                    </span>
                    <span className="text-xl font-bold tabular-nums">{p.total}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Tablero por columnas */}
          <section>
            <h2 className="mb-2 text-sm font-bold text-gobierno">
              Pendientes {agrupar === "area" ? "por área" : agrupar === "prioridad" ? "por prioridad" : "por estado"}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {columnas.map((c) => (
                <div key={c.id} className="flex w-72 shrink-0 flex-col rounded-xl border bg-superficie xl:w-auto xl:min-w-[14rem] xl:max-w-sm xl:flex-1">
                  <div className="flex items-center justify-between rounded-t-xl border-b bg-white px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className={cn("size-2.5 rounded-full", c.punto)} />
                      {c.titulo}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-foreground">{c.items.length}</span>
                  </div>
                  <div className="max-h-[34rem] space-y-2 overflow-y-auto p-2">
                    {c.items.map((o) => (
                      <TarjetaOficio key={o.id} o={o} hoy={hoy} onClick={() => setPrevia(o)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <VistaPrevia o={previa} hoy={hoy} cerrar={() => setPrevia(null)} />
    </div>
  )
}

function TarjetaOficio({ o, hoy, grande, onClick }: { o: OficioListado; hoy: string; grande?: boolean; onClick: () => void }) {
  const c = colorArea(o.areaResponsable)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg border border-l-4 bg-white p-3 text-left shadow-sm transition hover:-translate-y-px hover:shadow",
        c.borde
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-foreground">{cuando(o.fechaRecepcion, hoy)}</span>
        <span className="font-mono text-muted-foreground">{o.folio}</span>
      </div>
      <p className={cn("font-medium leading-snug text-foreground", grande ? "line-clamp-3 text-sm" : "line-clamp-2 text-[13px]")}>
        {o.asunto || <span className="italic text-muted-foreground">Sin asunto capturado</span>}
      </p>
      {grande && o.resumen && <p className="line-clamp-2 text-xs text-muted-foreground">{o.resumen}</p>}
      <p className="line-clamp-1 text-[11px] text-muted-foreground">{o.dependencia || o.remitente || "Remitente sin capturar"}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <EstadoBadge estado={o.estado} />
        {o.prioridad !== "normal" && (
          <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase", PRIORIDADES_OFICIO.find((p) => p.valor === o.prioridad)?.clase)}>
            <Flag className="size-3" /> {label(PRIORIDADES_OFICIO, o.prioridad)}
          </span>
        )}
        {!o.revisado && <Sparkles className="size-3.5 text-violet-600" aria-label="Por revisar" />}
      </div>
    </button>
  )
}

function VistaPrevia({ o, hoy, cerrar }: { o: OficioListado | null; hoy: string; cerrar: () => void }) {
  const esImagen = o?.archivoTipo?.startsWith("image/")
  return (
    <Dialog open={o !== null} onOpenChange={(v) => !v && cerrar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {o && (
          <>
            <DialogHeader>
              <p className="font-mono text-xs text-gobierno">
                {o.folio}
                {o.numeroRecepcion && ` · ${o.numeroRecepcion}`}
                {o.numeroOficio && ` · Oficio ${o.numeroOficio}`}
              </p>
              <DialogTitle className="text-left leading-snug">{o.asunto || "Sin asunto capturado"}</DialogTitle>
              <DialogDescription className="text-left">
                {[o.remitente, o.dependencia].filter(Boolean).join(" · ") || "Remitente sin capturar"} · recibido{" "}
                {cuando(o.fechaRecepcion, hoy).toLowerCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-1.5">
              <EstadoBadge estado={o.estado} />
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", colorArea(o.areaResponsable).suave)}>
                {label(AREAS_OFICIO, o.areaResponsable)}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">{label(TIPOS_OFICIO, o.tipo)}</span>
              {o.prioridad !== "normal" && (
                <span className={cn("flex items-center gap-1 text-[11px] font-bold uppercase", PRIORIDADES_OFICIO.find((p) => p.valor === o.prioridad)?.clase)}>
                  <Flag className="size-3" /> {label(PRIORIDADES_OFICIO, o.prioridad)}
                </span>
              )}
              <PlazoBadge estado={o.estado} fechaLimite={o.fechaLimite} hoy={hoy} />
              {!o.revisado && <RevisionBadge revisado={o.revisado} iaEstado={o.iaEstado} />}
            </div>

            <div className="rounded-lg border bg-superficie p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qué dice</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {o.resumen || <span className="italic text-muted-foreground">Sin resumen capturado.</span>}
              </p>
            </div>

            {esImagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/oficios/${o.id}/archivo`}
                alt={`Escaneo de ${o.folio}`}
                onError={(e) => (e.currentTarget.style.display = "none")}
                className="max-h-[28rem] w-full rounded-lg border bg-white object-contain"
              />
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/oficios/${o.id}`}
                className="inline-flex h-9 items-center rounded-md bg-agua px-3 text-sm font-medium text-white hover:bg-agua-600"
              >
                Abrir expediente
              </Link>
              {o.tieneArchivo && (
                <a
                  href={`/api/oficios/${o.id}/archivo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-sm font-medium hover:bg-muted/50"
                >
                  <FileText className="size-4" /> {esImagen ? "Ver escaneo completo" : "Ver escaneo (PDF)"}
                </a>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
