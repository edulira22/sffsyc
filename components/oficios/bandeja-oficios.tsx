"use client"

import { Fragment, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Inbox,
  Search,
  Sparkles,
  Wallet,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AREAS_OFICIO,
  ESTADOS_OFICIO,
  TIPOS_OFICIO,
  diasEntre,
  esPendiente,
  label,
  semaforo,
} from "@/lib/oficios/catalogos"
import type { OficioListado, ResumenOficios } from "@/lib/data/oficios"
import { EstadoBadge, PlazoBadge, PrioridadTexto, RevisionBadge } from "@/components/oficios/insignias"

type Vista = "todos" | "pendientes" | "vencidos" | "por_vencer" | "sin_revisar" | string

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

function fecha(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

/** "2026-07" → "Julio 2026" */
function nombreMes(clave: string) {
  const [a, m] = clave.split("-")
  return `${MESES[Number(m) - 1]} ${a}`
}

export function BandejaOficios({
  oficios,
  resumen,
  hoy,
  anios,
  anio,
}: {
  oficios: OficioListado[]
  resumen: ResumenOficios
  hoy: string
  anios: number[]
  anio: number
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [vista, setVista] = useState<Vista>("todos")
  const [area, setArea] = useState("")
  const [mes, setMes] = useState("")
  const [q, setQ] = useState("")
  const [recientes, setRecientes] = useState(true)
  const [abierto, setAbierto] = useState<number | null>(null)

  const indice = useMemo(
    () =>
      oficios.map((o) => ({
        o,
        texto: norm(`${o.folio} ${o.numeroOficio} ${o.numeroRecepcion} ${o.remitente} ${o.dependencia} ${o.asunto} ${o.resumen}`),
        sem: semaforo(o.estado, o.fechaLimite, hoy),
        mes: o.fechaRecepcion.slice(0, 7),
      })),
    [oficios, hoy]
  )

  // Todo menos el mes: de aquí salen los conteos de los chips de mes.
  const filtrados = useMemo(() => {
    const palabras = norm(q).trim().split(/\s+/).filter(Boolean)
    return indice.filter(({ o, sem, texto }) => {
      if (vista === "pendientes" && !esPendiente(o.estado)) return false
      if (vista === "vencidos" && sem !== "vencido") return false
      if (vista === "por_vencer" && sem !== "por_vencer") return false
      if (vista === "sin_revisar" && o.revisado) return false
      if (ESTADOS_OFICIO.some((e) => e.valor === vista) && o.estado !== vista) return false
      if (area && o.areaResponsable !== area) return false
      return palabras.every((p) => texto.includes(p))
    })
  }, [indice, vista, area, q])

  const meses = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const x of filtrados) cuenta.set(x.mes, (cuenta.get(x.mes) ?? 0) + 1)
    return Array.from(cuenta.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtrados])

  // Lista ordenada por fecha de recepción y agrupada por mes.
  const grupos = useMemo(() => {
    const dir = recientes ? -1 : 1
    const lista = filtrados
      .filter((x) => !mes || x.mes === mes)
      .sort((a, b) => dir * (a.o.fechaRecepcion.localeCompare(b.o.fechaRecepcion) || a.o.consecutivo - b.o.consecutivo))
    const out: { mes: string; items: typeof lista }[] = []
    for (const x of lista) {
      const ultimo = out[out.length - 1]
      if (ultimo && ultimo.mes === x.mes) ultimo.items.push(x)
      else out.push({ mes: x.mes, items: [x] })
    }
    return out
  }, [filtrados, mes, recientes])

  const total = grupos.reduce((n, g) => n + g.items.length, 0)
  const ultimo = useMemo(
    () => oficios.reduce<OficioListado | null>((m, o) => (!m || o.consecutivo > m.consecutivo ? o : m), null),
    [oficios]
  )

  const tarjetas = [
    { id: "pendientes", icono: Inbox, valor: resumen.pendientes, texto: "Pendientes", color: "text-gobierno bg-gobierno-50" },
    { id: "vencidos", icono: AlertTriangle, valor: resumen.vencidos, texto: "Vencidos", color: "text-rose-700 bg-rose-50" },
    { id: "por_vencer", icono: Clock, valor: resumen.porVencer, texto: "Por vencer (3 días)", color: "text-amber-700 bg-amber-50" },
    { id: "sin_revisar", icono: Sparkles, valor: resumen.sinRevisar, texto: "Por revisar", color: "text-violet-700 bg-violet-50" },
  ]

  const chipsEstado: { id: Vista; texto: string }[] = [
    { id: "todos", texto: "Todos" },
    { id: "pendientes", texto: "Pendientes" },
    { id: "atendido", texto: "Atendidos" },
    { id: "sin_revisar", texto: "Por revisar" },
    { id: "vencidos", texto: "Vencidos" },
  ]

  const hayFiltros = vista !== "todos" || area || mes || q

  return (
    <div className="space-y-4">
      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {tarjetas.map((t) => {
          const Icono = t.icono
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setVista(vista === t.id ? "todos" : t.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition-colors hover:border-gobierno/30",
                vista === t.id && "border-gobierno ring-1 ring-gobierno/20"
              )}
            >
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", t.color)}>
                <Icono className="size-4" />
              </span>
              <span>
                <span className="block text-xl font-bold tabular-nums text-foreground">{t.valor}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">{t.texto}</span>
              </span>
            </button>
          )
        })}
        <div className="col-span-2 flex items-center gap-3 rounded-xl border bg-white p-3 lg:col-span-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-agua-50 text-agua">
            <Wallet className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold tabular-nums text-foreground">
              {resumen.ia.disponible ? `US$ ${resumen.ia.gastoMesUsd.toFixed(2)}` : "IA inactiva"}
            </span>
            <span className="block text-[11px] leading-tight text-muted-foreground">
              {resumen.ia.disponible ? `IA este mes · tope US$ ${resumen.ia.topeMesUsd}` : "Captura manual"}
              {` · ${resumen.recibidosMes} recibidos este mes`}
            </span>
          </span>
        </div>
      </div>

      {/* Último registrado */}
      {ultimo && (
        <Link
          href={`/oficios/${ultimo.id}`}
          className="flex items-center gap-3 rounded-xl border border-agua/30 bg-agua-50/60 px-4 py-3 transition-colors hover:bg-agua-50"
        >
          <span className="shrink-0 rounded-md bg-agua px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Último
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              <span className="font-mono text-gobierno">{ultimo.folio}</span> · {ultimo.asunto || "Sin asunto capturado"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Recibido el {fecha(ultimo.fechaRecepcion)} · {[ultimo.remitente, ultimo.dependencia].filter(Boolean).join(" · ") || "Remitente sin capturar"}
            </span>
          </span>
          <ExternalLink className="size-4 shrink-0 text-agua" />
        </Link>
      )}

      {/* Filtros */}
      <div className="space-y-3 rounded-xl border bg-white p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar en asunto, resumen, remitente, folio o número (p. ej. B7-002)…"
              className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              aria-label="Filtrar por área"
            >
              <option value="">Todas las áreas</option>
              {AREAS_OFICIO.map((a) => (
                <option key={a.valor} value={a.valor}>{a.label}</option>
              ))}
            </select>
            {anios.length > 1 && (
              <select
                value={anio}
                onChange={(e) => {
                  const p = new URLSearchParams(params.toString())
                  p.set("anio", e.target.value)
                  setMes("")
                  router.push(`/oficios?${p.toString()}`)
                }}
                className="h-10 rounded-md border border-input bg-white px-3 text-sm font-medium"
                aria-label="Año"
              >
                {anios.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setRecientes(!recientes)}
              className="flex h-10 items-center gap-1.5 rounded-md border border-input bg-white px-3 text-sm hover:bg-muted/50"
              title="Cambiar el orden"
            >
              {recientes ? <ArrowDownWideNarrow className="size-4" /> : <ArrowUpWideNarrow className="size-4" />}
              {recientes ? "Más recientes" : "Más antiguos"}
            </button>
          </div>
        </div>

        {/* Estado */}
        <div className="flex flex-wrap items-center gap-1.5">
          {chipsEstado.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setVista(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                vista === c.id ? "border-gobierno bg-gobierno text-white" : "bg-white text-muted-foreground hover:border-gobierno/40 hover:text-foreground"
              )}
            >
              {c.texto}
            </button>
          ))}
          <select
            value={chipsEstado.some((c) => c.id === vista) ? "" : vista}
            onChange={(e) => setVista(e.target.value || "todos")}
            className={cn(
              "h-7 rounded-full border px-2 text-xs",
              chipsEstado.some((c) => c.id === vista) ? "text-muted-foreground" : "border-gobierno text-gobierno"
            )}
            aria-label="Otro estado"
          >
            <option value="">Otro estado…</option>
            {ESTADOS_OFICIO.filter((e) => e.valor !== "atendido").map((e) => (
              <option key={e.valor} value={e.valor}>{e.label}</option>
            ))}
            <option value="por_vencer">Por vencer</option>
          </select>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setVista("todos"); setArea(""); setMes(""); setQ("")
              }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Quitar filtros
            </button>
          )}
        </div>

        {/* Mes */}
        {meses.length > 0 && (
          <div className="-mx-3 flex gap-1.5 overflow-x-auto border-t px-3 pt-3">
            <button
              type="button"
              onClick={() => setMes("")}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium",
                !mes ? "border-agua bg-agua text-white" : "bg-white text-muted-foreground hover:border-agua/50"
              )}
            >
              Todo el año <span className="opacity-75">· {filtrados.length}</span>
            </button>
            {meses.map(([clave, n]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setMes(mes === clave ? "" : clave)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium",
                  mes === clave ? "border-agua bg-agua text-white" : "bg-white text-muted-foreground hover:border-agua/50"
                )}
              >
                {MESES[Number(clave.slice(5)) - 1].slice(0, 3)}
                {clave.slice(0, 4) !== String(anio) && ` ${clave.slice(2, 4)}`}
                <span className="opacity-75"> · {n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista agrupada por mes */}
      <div className="overflow-hidden rounded-xl border bg-white">
        {total === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {oficios.length === 0 ? "Aún no hay oficios registrados en este año." : "Sin oficios con estos filtros."}
          </p>
        ) : (
          grupos.map((g) => (
            <Fragment key={g.mes}>
              <div className="flex items-baseline justify-between border-b bg-superficie px-4 py-2">
                <h3 className="text-sm font-bold text-gobierno">{nombreMes(g.mes)}</h3>
                <span className="text-xs text-muted-foreground">
                  {g.items.length} {g.items.length === 1 ? "oficio" : "oficios"}
                  {` · ${g.items.filter((x) => esPendiente(x.o.estado)).length} pendientes`}
                </span>
              </div>
              <ul className="divide-y">
                {g.items.map(({ o }) => (
                  <FilaOficio key={o.id} o={o} hoy={hoy} abierto={abierto === o.id} alternar={() => setAbierto(abierto === o.id ? null : o.id)} />
                ))}
              </ul>
            </Fragment>
          ))
        )}
      </div>
    </div>
  )
}

function FilaOficio({ o, hoy, abierto, alternar }: { o: OficioListado; hoy: string; abierto: boolean; alternar: () => void }) {
  const dias = esPendiente(o.estado) ? diasEntre(o.fechaRecepcion, hoy) : null
  const remitente = [o.remitente, o.dependencia].filter(Boolean).join(" · ")

  return (
    <li className={cn(abierto && "bg-muted/30")}>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 md:gap-4"
      >
        <div className="w-16 shrink-0 pt-0.5 md:w-20">
          <p className="text-sm font-semibold text-foreground">{fecha(o.fechaRecepcion)}</p>
          <p className="font-mono text-[11px] text-gobierno">{o.folio}</p>
          {o.numeroRecepcion && <p className="font-mono text-[10px] text-muted-foreground">{o.numeroRecepcion}</p>}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-foreground", !abierto && "line-clamp-2")}>
            {o.asunto || <span className="italic text-muted-foreground">Sin asunto capturado</span>}
          </p>
          {o.resumen && !abierto && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{o.resumen}</p>}
          <p className="mt-1 truncate text-xs text-muted-foreground">{remitente || "Remitente sin capturar"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
            <EstadoBadge estado={o.estado} />
            {!o.revisado && <RevisionBadge revisado={o.revisado} iaEstado={o.iaEstado} />}
          </div>
        </div>
        <div className="hidden w-48 shrink-0 flex-col items-end gap-1.5 md:flex">
          <EstadoBadge estado={o.estado} />
          <span className="text-right text-[11px] text-muted-foreground">{label(AREAS_OFICIO, o.areaResponsable)}</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <PlazoBadge estado={o.estado} fechaLimite={o.fechaLimite} hoy={hoy} />
            {!o.revisado && <RevisionBadge revisado={o.revisado} iaEstado={o.iaEstado} />}
            {dias !== null && dias > 7 && !o.fechaLimite && (
              <span className="text-[11px] text-muted-foreground">{dias} días</span>
            )}
          </div>
        </div>
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="space-y-3 px-4 pb-4 md:pl-[7.5rem]">
          <div className="rounded-lg border bg-white p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qué dice</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {o.resumen || <span className="italic text-muted-foreground">Sin resumen capturado.</span>}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
            <Dato titulo="Tipo" valor={label(TIPOS_OFICIO, o.tipo)} />
            <Dato titulo="Área" valor={label(AREAS_OFICIO, o.areaResponsable)} />
            <Dato titulo="No. de oficio" valor={o.numeroOficio || "—"} />
            <Dato titulo="Prioridad" valor={o.prioridad === "normal" ? "Normal" : <PrioridadTexto prioridad={o.prioridad} />} />
          </dl>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/oficios/${o.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-agua px-3 text-sm font-medium text-white hover:bg-agua-600"
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
                <FileText className="size-4" /> Ver escaneo
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{titulo}</dt>
      <dd className="truncate font-medium text-foreground">{valor}</dd>
    </div>
  )
}
