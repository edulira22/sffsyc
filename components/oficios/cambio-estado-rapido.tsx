"use client"

import { Fragment, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ESTADOS_OFICIO, ETAPAS_OFICIO, label, type EstadoOficio } from "@/lib/oficios/catalogos"
import { cambiarEstadoOficio } from "@/app/(app)/oficios/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Estado actual a la vista y un botón "Actualizar estado" que despliega los
// estados en el orden del trámite. Elegir uno pide confirmación (con nota
// opcional) y el cambio queda en la bitácora del oficio.

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
  const [nota, setNota] = useState("")
  const [pendiente, iniciar] = useTransition()
  const actual = ESTADOS_OFICIO.find((e) => e.valor === estado)
  const etapaActual = ETAPAS_OFICIO.find((e) => e.valor === actual?.etapa)
  const nuevo = ESTADOS_OFICIO.find((e) => e.valor === destino)

  function confirmar() {
    if (!destino) return
    const valor = destino
    iniciar(async () => {
      const r = await cambiarEstadoOficio(id, valor, nota)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(`${folio}: ${label(ESTADOS_OFICIO, valor)}`)
      setDestino(null)
      setNota("")
      alCambiar?.()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">Estado actual</p>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className={cn("size-2.5 shrink-0 rounded-full", actual?.punto ?? "bg-slate-400")} />
          {actual?.label ?? estado}
          {etapaActual && <span className="font-normal text-muted-foreground">· {etapaActual.label}</span>}
        </p>
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5 bg-gobierno hover:bg-gobierno/90" disabled={pendiente}>
            <RefreshCw className="size-4" /> Actualizar estado <ChevronDown className="size-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {ETAPAS_OFICIO.map((etapa, i) => (
            <Fragment key={etapa.valor}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {etapa.label}
              </DropdownMenuLabel>
              {ESTADOS_OFICIO.filter((e) => e.etapa === etapa.valor).map((e) => {
                const esActual = e.valor === estado
                return (
                  <DropdownMenuItem
                    key={e.valor}
                    disabled={esActual}
                    onSelect={() => setDestino(e.valor)}
                    className="cursor-pointer items-start gap-2.5 py-2"
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.punto)} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {e.label}
                        {esActual && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(actual)</span>}
                      </span>
                      <span className="block text-xs leading-snug text-muted-foreground">{e.descripcion}</span>
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={destino !== null}
        onOpenChange={(v) => {
          if (!v && !pendiente) {
            setDestino(null)
            setNota("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar a {nuevo?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {folio} pasará de <b>{actual?.label ?? estado}</b> a <b>{nuevo?.label}</b>. El cambio queda registrado en su
              bitácora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={destino === "canalizado" ? "¿A quién se canalizó? (opcional)" : "Nota (opcional)"}
            maxLength={300}
          />
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
