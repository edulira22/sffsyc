"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { Zona } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { CoordinadoraFormDialog } from "@/components/catalogos/coordinadora-form-dialog"

export function NuevaCoordinadoraButton({
  zonas,
}: {
  zonas: Pick<Zona, "id" | "nombre">[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-agua hover:bg-agua-600">
        <Plus className="size-4" />
        Nueva coordinadora
      </Button>
      <CoordinadoraFormDialog open={open} onOpenChange={setOpen} zonas={zonas} />
    </>
  )
}
