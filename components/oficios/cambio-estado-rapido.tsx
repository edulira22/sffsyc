"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ESTADOS_OFICIO, label, type EstadoOficio } from "@/lib/oficios/catalogos"
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

// Cambio de estado a la mano: un toque en el estado nuevo y una confirmación.
// El cambio queda en la bitácora del oficio, como cualquier otro.

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
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Estado</p>
      <div className="flex flex-wrap gap-1.5">
        {ESTADOS_OFICIO.map((e) => {
          const actual = e.valor === estado
          return (
            <button
              key={e.valor}
              type="button"
              disabled={actual || pendiente}
              onClick={() => setDestino(e.valor)}
              aria-pressed={actual}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                actual ? cn(e.clase, "ring-2 ring-offset-1 ring-gobierno/30") : "bg-white text-muted-foreground hover:border-gobierno/40 hover:text-foreground"
              )}
            >
              {e.label}
            </button>
          )
        })}
      </div>

      <AlertDialog open={destino !== null} onOpenChange={(v) => !v && !pendiente && setDestino(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar a {destino ? label(ESTADOS_OFICIO, destino) : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              {folio} pasará de <b>{label(ESTADOS_OFICIO, estado)}</b> a <b>{destino ? label(ESTADOS_OFICIO, destino) : ""}</b>. El
              cambio queda registrado en su bitácora.
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
