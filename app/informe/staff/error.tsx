"use client"

import { RotateCw } from "lucide-react"

// Si falla la carga (señal débil, base de datos ocupada), el staff puede
// reintentar sin perder la pestaña.
export default function ErrorStaff({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-superficie px-6">
      <div className="max-w-sm text-center">
        <p className="text-lg font-semibold text-foreground">
          No se pudo cargar el acomodo
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Revisa tu conexión e intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gobierno px-5 py-3 text-sm font-semibold text-white hover:bg-gobierno/90"
        >
          <RotateCw className="size-4" />
          Reintentar
        </button>
      </div>
    </div>
  )
}
