"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

// Imprime la página. El expediente está pensado para que solo el documento
// salga en la hoja (el resto del shell se oculta con la clase print:hidden).
export function BotonImprimir() {
  return (
    <Button
      onClick={() => window.print()}
      className="gap-2 bg-gobierno hover:bg-gobierno/90"
    >
      <Printer className="size-4" />
      Imprimir
    </Button>
  )
}
