import Link from "@/components/ui/enlace"
import { Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { ESTADOS_CURSO } from "@/lib/stem/catalogos"

// Piezas visuales compartidas del Centro STEM. Estilo sobrio: punto de color
// y texto, sin cápsulas pastel.

export const claseInput =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"

export function Campo({
  etiqueta,
  ayuda,
  error,
  children,
  className,
}: {
  etiqueta: string
  ayuda?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-foreground">{etiqueta}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-700">{error}</span>
      ) : (
        ayuda && <span className="mt-1 block text-[11px] text-muted-foreground">{ayuda}</span>
      )}
    </label>
  )
}

export function Seleccion({
  valor,
  onCambio,
  opciones,
  vacio,
  disabled,
}: {
  valor: string
  onCambio: (v: string) => void
  opciones: { valor: string; label: string }[]
  vacio?: string
  disabled?: boolean
}) {
  return (
    <select value={valor} onChange={(e) => onCambio(e.target.value)} disabled={disabled} className={claseInput}>
      {vacio !== undefined && <option value="">{vacio}</option>}
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function EstadoCursoTexto({ estado, className }: { estado: string; className?: string }) {
  const e = ESTADOS_CURSO.find((x) => x.valor === estado)
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground", className)}>
      <span className={cn("size-2 rounded-full", e?.punto ?? "bg-slate-400")} />
      {e?.label ?? estado}
    </span>
  )
}

/** Inscritos contra cupo: barra delgada que se pone ámbar al llenarse. */
export function Ocupacion({ inscritos, cupo }: { inscritos: number; cupo: number }) {
  const nivel = cupo ? Math.min(1, inscritos / cupo) : 0
  return (
    <div className="min-w-0">
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>
          <b className="text-foreground">{inscritos}</b> de {cupo} lugares
        </span>
        {inscritos >= cupo && <span className="font-medium text-amber-700">Lleno</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", nivel >= 1 ? "bg-amber-500" : "bg-agua")} style={{ width: `${nivel * 100}%` }} />
      </div>
    </div>
  )
}

/** Porcentaje de asistencia con color según qué tan bien va. */
export function Porcentaje({ valor }: { valor: number | null }) {
  if (valor == null) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        valor >= 80 ? "text-green-700" : valor >= 60 ? "text-amber-700" : "text-rose-700"
      )}
    >
      {valor}%
    </span>
  )
}

export function SinAccesoStem({ texto }: { texto?: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-white px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-foreground">No tienes acceso a esta parte del Centro STEM</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {texto ?? "Si lo necesitas, pide a quien administra los usuarios que te dé acceso a la sección Centro STEM."}
        </p>
      </div>
      <Link href="/dashboard" className="text-sm font-medium text-agua hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
