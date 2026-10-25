import { AlertTriangle, CheckCircle2, Clock, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  diasEntre,
  ESTADOS_OFICIO,
  PRIORIDADES_OFICIO,
  semaforo,
} from "@/lib/oficios/catalogos"

export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  const e = ESTADOS_OFICIO.find((x) => x.valor === estado)
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", e?.clase, className)}>
      {e?.label ?? estado}
    </span>
  )
}

export function PrioridadTexto({ prioridad }: { prioridad: string }) {
  if (prioridad === "normal") return null
  const p = PRIORIDADES_OFICIO.find((x) => x.valor === prioridad)
  return <span className={cn("text-[11px] font-bold uppercase tracking-wide", p?.clase)}>{p?.label}</span>
}

function fechaCorta(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

/** Plazo: vencido / por vencer / en tiempo. Nada si no hay plazo o ya se cerró. */
export function PlazoBadge({ estado, fechaLimite, hoy }: { estado: string; fechaLimite: string | null; hoy: string }) {
  const s = semaforo(estado, fechaLimite, hoy)
  if (!fechaLimite || s === "sin_plazo" || s === "cerrado") return null
  const dias = diasEntre(hoy, fechaLimite)
  const texto =
    s === "vencido"
      ? `Venció hace ${-dias} ${-dias === 1 ? "día" : "días"}`
      : dias === 0
        ? "Vence hoy"
        : `Vence ${dias === 1 ? "mañana" : `en ${dias} días`}`
  return (
    <span
      title={`Fecha límite: ${fechaCorta(fechaLimite)}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        s === "vencido" && "bg-rose-100 text-rose-800",
        s === "por_vencer" && "bg-amber-100 text-amber-800",
        s === "en_tiempo" && "bg-muted text-muted-foreground"
      )}
    >
      {s === "vencido" ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {texto}
    </span>
  )
}

export function RevisionBadge({ revisado, iaEstado }: { revisado: boolean; iaEstado: string }) {
  if (revisado) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 className="size-3" /> Revisado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
      <Sparkles className="size-3" />
      {iaEstado === "leido" ? "Por revisar (Lirabot)" : "Por capturar"}
    </span>
  )
}
