"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BotonImprimir({
  className = "gap-2 bg-gobierno hover:bg-gobierno/90",
  label = "Imprimir",
}: {
  className?: string
  label?: string
} = {}) {
  return (
    <Button onClick={() => window.print()} className={className}>
      <Printer className="size-4" />
      {label}
    </Button>
  )
}
