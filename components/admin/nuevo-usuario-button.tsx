"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { Zona } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { UsuarioFormDialog } from "@/components/admin/usuario-form-dialog"

export function NuevoUsuarioButton({
  zonas,
}: {
  zonas: Pick<Zona, "id" | "nombre">[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-agua hover:bg-agua-600">
        <Plus className="size-4" />
        Nuevo usuario
      </Button>
      <UsuarioFormDialog open={open} onOpenChange={setOpen} zonas={zonas} />
    </>
  )
}
