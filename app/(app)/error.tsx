"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"

// Red de seguridad para todas las páginas autenticadas: si una falla
// (p. ej. un parpadeo de la base de datos), mostramos un mensaje claro
// con el detalle técnico y un botón de reintentar — nunca pantalla blanca.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [verDetalle, setVerDetalle] = useState(false)

  useEffect(() => {
    console.error("[AppError]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-50">
        <AlertTriangle className="size-7 text-amber-500" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-foreground">
          No se pudo cargar la página
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocurrió un fallo temporal. Vuelve a intentarlo; si persiste, abre el
          detalle técnico y compártelo.
        </p>
      </div>

      <Button onClick={() => reset()} className="gap-2 bg-gobierno hover:bg-gobierno/90">
        <RefreshCw className="size-4" />
        Reintentar
      </Button>

      <button
        type="button"
        onClick={() => setVerDetalle((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={`size-3.5 transition-transform ${verDetalle ? "rotate-180" : ""}`} />
        Detalle técnico
      </button>

      {verDetalle && (
        <pre className="max-w-lg overflow-auto rounded-lg border bg-muted/40 p-3 text-left text-xs text-destructive whitespace-pre-wrap break-words">
          {error.message || "Error desconocido"}
          {error.digest ? `\n\nID: ${error.digest}` : ""}
        </pre>
      )}
    </div>
  )
}
