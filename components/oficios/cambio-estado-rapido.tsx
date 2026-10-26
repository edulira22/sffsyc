"use client"

import { Fragment, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ESTADOS_OFICIO, ETAPAS_OFICIO, label, type EstadoOficio } from "@/lib/oficios/catalogos"
import { cambiarEstadoOficio } from "@/app/(app)/oficios/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Cambio de estado a la mano. Los estados van en el orden del trámite
// (por atender → en curso → cerrado) y el color dice en qué punto va:
// rojo, ámbar, verde. Un toque en otro estado pide confirmación y el cambio
// queda en la bitácora del oficio.

export function CambioEstadoRapido({
  id,
  folio,
  estado,
  alCambiar,
}: {
  id: number
  folio: string
  estado: string
  alCambiar?: () => void
}) {
  const router = useRouter()
  const [destino, setDestino] = useState<EstadoOficio | null>(null)
  const [pendiente, iniciar] = useTransition()
  const infoDestino = ESTADOS_OFICIO.find((e) => e.valor === destino)

  function confirmar() {
    if (!destino) return
    const nuevo = destino
    iniciar(async () => {
      const r = await cambiarEstadoOficio(id, nuevo, "")
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(`${folio}: ${label(ESTADOS_OFICIO, nuevo)}`)
      setDestino(null)
      alCambiar?.()
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Estado del trámite</p>
        <p className="text-[11px] text-muted-foreground">Toca un estado para cambiarlo; te pediremos confirmar.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {ETAPAS_OFICIO.map((etapa, i) => (
          <Fragment key={etapa.valor}>
            {i > 0 && <ChevronRight className="hidden size-4 shrink-0 self-center text-muted-foreground/60 sm:block" />}
            <div className="min-w-0 sm:flex-1">
              <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-wide", etapa.texto)}>{etapa.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS_OFICIO.filter((e) => e.etapa === etapa.valor).map((e) => {
                  const actual = e.valor === estado
                  return (
                    <button
                      key={e.valor}
                      type="button"
                      disabled={actual || pendiente}
                      onClick={() => setDestino(e.valor)}
                      aria-pressed={actual}
                      title={actual ? "Estado actual" : `Cambiar a ${e.label}: ${e.descripcion}`}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        actual ? cn(e.clase, "font-bold shadow-sm ring-2 ring-offset-1 ring-gobierno/25") : cn("bg-white", e.contorno)
                      )}
                    >
                      {actual && <Check className="size-3.5" />}
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Fragment>
        ))}
      </div>

      <AlertDialog open={destino !== null} onOpenChange={(v) => !v && !pendiente && setDestino(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar a {infoDestino?.label}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {folio} pasará de <b>{label(ESTADOS_OFICIO, estado)}</b> a <b>{infoDestino?.label}</b>. El cambio queda
                  registrado en su bitácora.
                </p>
                {infoDestino && <p className="text-xs">{infoDestino.descripcion}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendiente}
              onClick={(ev) => {
                ev.preventDefault()
                confirmar()
              }}
              className="bg-agua hover:bg-agua-600"
            >
              {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Sí, cambiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
