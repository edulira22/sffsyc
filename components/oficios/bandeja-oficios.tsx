"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Clock, Inbox, Search, Sparkles, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AREAS_OFICIO,
  ESTADOS_OFICIO,
  diasEntre,
  esPendiente,
  label,
  semaforo,
} from "@/lib/oficios/catalogos"
import type { OficioListado, ResumenOficios } from "@/lib/data/oficios"
import { EstadoBadge, PlazoBadge, PrioridadTexto, RevisionBadge } from "@/components/oficios/insignias"

type Vista = "pendientes" | "vencidos" | "por_vencer" | "sin_revisar" | "todos" | string

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

function fecha(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
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
  const [vista, setVista] = useState<Vista>("pendientes")
  const [area, setArea] = useState("")
  const [q, setQ] = useState("")

  const indice = useMemo(
    () =>
      oficios.map((o) => ({
        o,
        texto: norm(`${o.folio} ${o.numeroOficio} ${o.remitente} ${o.dependencia} ${o.asunto}`),
        sem: semaforo(o.estado, o.fechaLimite, hoy),
      })),
    [oficios, hoy]
  )

  const lista = useMemo(() => {
    const palabras = norm(q).trim().split(/\s+/).filter(Boolean)
    return indice
      .filter(({ o, sem }) => {
        if (vista === "pendientes" && !esPendiente(o.estado)) return false
        if (vista === "vencidos" && sem !== "vencido") return false
        if (vista === "por_vencer" && sem !== "por_vencer") return false
        if (vista === "sin_revisar" && o.revisado) return false
        if (ESTADOS_OFICIO.some((e) => e.valor === vista) && o.estado !== vista) return false
        if (area && o.areaResponsable !== area) return false
        return true
      })
      .filter(({ texto }) => palabras.every((p) => texto.includes(p)))
      .sort((a, b) => {
        // Pendientes: lo más urgente arriba (vencidos, por vencer, sin plazo por antigüedad).
        if (vista === "pendientes" || vista === "vencidos" || vista === "por_vencer") {
          const peso = (s: string) => (s === "vencido" ? 0 : s === "por_vencer" ? 1 : s === "en_tiempo" ? 2 : 3)
          const d = peso(a.sem) - peso(b.sem)
          if (d) return d
          if (a.o.fechaLimite && b.o.fechaLimite) return a.o.fechaLimite.localeCompare(b.o.fechaLimite)
          return a.o.fechaRecepcion.localeCompare(b.o.fechaRecepcion)
        }
        return b.o.consecutivo - a.o.consecutivo
      })
      .map((x) => x.o)
  }, [indice, vista, area, q])

  const tarjetas = [
    { id: "pendientes", icono: Inbox, valor: resumen.pendientes, texto: "Pendientes", color: "text-gobierno bg-gobierno-50" },
    { id: "vencidos", icono: AlertTriangle, valor: resumen.vencidos, texto: "Vencidos", color: "text-rose-700 bg-rose-50" },
    { id: "por_vencer", icono: Clock, valor: resumen.porVencer, texto: "Por vencer (3 días)", color: "text-amber-700 bg-amber-50" },
    { id: "sin_revisar", icono: Sparkles, valor: resumen.sinRevisar, texto: "Por revisar", color: "text-violet-700 bg-violet-50" },
  ]

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
              onClick={() => setVista(t.id)}
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
              {resumen.ia.disponible
                ? `IA este mes · tope US$ ${resumen.ia.topeMesUsd}`
                : "Captura manual"}
              {` · ${resumen.recibidosMes} recibidos este mes`}
            </span>
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2 rounded-xl border bg-white p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por folio, número, remitente, dependencia o asunto…"
            className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value)}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            aria-label="Filtrar por estado"
          >
            <option value="pendientes">Pendientes</option>
            <option value="todos">Todos</option>
            <option value="vencidos">Vencidos</option>
            <option value="por_vencer">Por vencer</option>
            <option value="sin_revisar">Por revisar</option>
            {ESTADOS_OFICIO.map((e) => (
              <option key={e.valor} value={e.valor}>{e.label}</option>
            ))}
          </select>
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
                router.push(`/oficios?${p.toString()}`)
              }}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              aria-label="Año"
            >
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-4 py-2.5 text-xs text-muted-foreground">
          {lista.length === 0
            ? oficios.length === 0
              ? "Aún no hay oficios registrados."
              : "Sin oficios con estos filtros."
            : `${lista.length} ${lista.length === 1 ? "oficio" : "oficios"}`}
        </div>
        <ul className="divide-y">
          {lista.map((o) => {
            const dias = esPendiente(o.estado) ? diasEntre(o.fechaRecepcion, hoy) : null
            return (
              <li key={o.id}>
                <Link href={`/oficios/${o.id}`} className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:gap-4">
                  <div className="w-28 shrink-0">
                    <p className="font-mono text-sm font-bold text-gobierno">{o.folio}</p>
                    <p className="text-[11px] text-muted-foreground">{fecha(o.fechaRecepcion)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{o.asunto || <span className="italic text-muted-foreground">Sin asunto capturado</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[o.remitente, o.dependencia].filter(Boolean).join(" · ") || "Remitente sin capturar"}
                      {o.numeroOficio && ` · ${o.numeroOficio}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:w-[22rem] md:justify-end">
                    <PrioridadTexto prioridad={o.prioridad} />
                    <PlazoBadge estado={o.estado} fechaLimite={o.fechaLimite} hoy={hoy} />
                    {!o.revisado && <RevisionBadge revisado={o.revisado} iaEstado={o.iaEstado} />}
                    <span className="text-[11px] text-muted-foreground">{label(AREAS_OFICIO, o.areaResponsable)}</span>
                    <EstadoBadge estado={o.estado} />
                    {dias !== null && dias > 7 && !o.fechaLimite && (
                      <span className="text-[11px] text-muted-foreground">{dias} días</span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
