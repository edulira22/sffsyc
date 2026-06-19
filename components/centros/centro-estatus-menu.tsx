"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import type { EstatusCentro } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { cambiarEstatusCentro } from "@/app/(app)/centros/actions"

export function CentroEstatusMenu({
  centroId,
  estatus,
}: {
  centroId: number
  estatus: EstatusCentro
}) {
  const router = useRouter()
  const [confirmar, setConfirmar] = useState(false)

  async function cambiar(nuevo: EstatusCentro, mensaje: string) {
    const r = await cambiarEstatusCentro(centroId, nuevo)
    if (r.ok) {
      toast.success(mensaje)
      router.refresh()
    } else toast.error(r.error)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Estatus
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {estatus !== "activo" && (
            <DropdownMenuItem onClick={() => cambiar("activo", "Centro activado")}>
              <Power className="size-4" />
              Marcar como activo
            </DropdownMenuItem>
          )}
          {estatus !== "pendiente" && (
            <DropdownMenuItem onClick={() => cambiar("pendiente", "Centro marcado como pendiente")}>
              <Power className="size-4" />
              Marcar como pendiente
            </DropdownMenuItem>
          )}
          {estatus !== "inactivo" && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmar(true)}
            >
              <PowerOff className="size-4" />
              Desactivar centro
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmar}
        onOpenChange={setConfirmar}
        titulo="¿Desactivar centro?"
        descripcion="El centro dejará de aparecer como activo. No se elimina ningún dato y podrás reactivarlo después."
        textoConfirmar="Desactivar"
        destructivo
        onConfirm={() => cambiar("inactivo", "Centro desactivado")}
      />
    </>
  )
}
