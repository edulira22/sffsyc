"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

// Abre el diálogo de impresión automáticamente al cargar la pestaña. Deja
// también un botón por si el navegador bloquea el auto-print.
export function AutoImprimir({ folio }: { folio: string }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-2 print:hidden">
      <p className="text-sm text-muted-foreground">
        Expediente <span className="font-mono font-medium text-foreground">{folio}</span>{" "}
        listo para imprimir.
      </p>
      <Button onClick={() => window.print()} className="gap-2 bg-gobierno hover:bg-gobierno/90">
        <Printer className="size-4" />
        Imprimir
      </Button>
    </div>
  )
}
