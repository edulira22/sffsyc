"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { CatalogoCategoria } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { ClaseFormDialog } from "@/components/catalogos/clase-form-dialog"

export function NuevaClaseButton({
  categorias,
}: {
  categorias: Pick<CatalogoCategoria, "id" | "nombre">[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-agua hover:bg-agua-600">
        <Plus className="size-4" />
        Nueva clase
      </Button>
      <ClaseFormDialog open={open} onOpenChange={setOpen} categorias={categorias} />
    </>
  )
}
