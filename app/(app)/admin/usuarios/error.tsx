"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function UsuariosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const esMigracion =
    error.message?.includes("areas_permitidas") ||
    error.message?.includes("column") ||
    error.message?.includes("does not exist")

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-50">
        <AlertTriangle className="size-7 text-amber-500" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-foreground">
          {esMigracion
            ? "Migración de base de datos pendiente"
            : "Error al cargar usuarios"}
        </h2>
        {esMigracion ? (
          <p className="mt-2 text-sm text-muted-foreground">
            La tabla de usuarios requiere una columna nueva (
            <code className="rounded bg-muted px-1 text-xs">areas_permitidas</code>). Ejecuta el SQL
            de migración en Supabase y vuelve a intentarlo.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/admin">Volver a Administración</Link>
        </Button>
        <Button onClick={reset} className="bg-gobierno hover:bg-gobierno/90">
          Reintentar
        </Button>
      </div>
    </div>
  )
}
