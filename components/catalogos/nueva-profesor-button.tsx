"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProfesorFormDialog } from "@/components/catalogos/profesor-form-dialog"

export function NuevaProfesorButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-agua hover:bg-agua-600">
        <Plus className="size-4" />
        Nuevo profesor
      </Button>
      <ProfesorFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
