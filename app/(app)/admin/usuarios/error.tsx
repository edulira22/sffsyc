"use client"

import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function UsuariosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[UsuariosError]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-50">
        <AlertTriangle className="size-7 text-amber-500" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-foreground">
          Error al cargar usuarios
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No se pudo conectar con la base de datos. Puede ser que el proyecto de
          Supabase esté en pausa (plan gratuito). Intenta recargar en unos segundos.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/60">
            Código: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/admin">Volver a Administración</Link>
        </Button>
        <Button onClick={reset} className="bg-gobierno hover:bg-gobierno/90 gap-2">
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      </div>
    </div>
  )
}
