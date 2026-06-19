"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

// Diálogo de confirmación reutilizable (controlado). Maneja su propio estado
// de carga mientras se ejecuta la acción asíncrona.
export function ConfirmDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  destructivo = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion?: string
  textoConfirmar?: string
  textoCancelar?: string
  destructivo?: boolean
  onConfirm: () => Promise<void> | void
}) {
  const [cargando, setCargando] = useState(false)

  async function confirmar() {
    setCargando(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setCargando(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !cargando && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descripcion && (
            <AlertDialogDescription>{descripcion}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cargando}>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              confirmar()
            }}
            disabled={cargando}
            className={cn(
              destructivo &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {cargando && <Loader2 className="size-4 animate-spin" />}
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
