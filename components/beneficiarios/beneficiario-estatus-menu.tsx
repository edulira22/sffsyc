"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, UserCheck, UserX, Ban } from "lucide-react"
import { toast } from "sonner"
import type { EstatusBeneficiario } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { cambiarEstatusBeneficiario } from "@/app/(app)/beneficiarios/actions"

export function BeneficiarioEstatusMenu({
  beneficiarioId,
  estatus,
}: {
  beneficiarioId: number
  estatus: EstatusBeneficiario
}) {
  const router = useRouter()
  const [confirmarBaja, setConfirmarBaja] = useState(false)

  async function cambiar(nuevo: EstatusBeneficiario, mensaje: string) {
    const r = await cambiarEstatusBeneficiario(beneficiarioId, nuevo)
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
            <DropdownMenuItem onClick={() => cambiar("activo", "Beneficiario activado")}>
              <UserCheck className="size-4" />
              Marcar como activo
            </DropdownMenuItem>
          )}
          {estatus !== "inactivo" && (
            <DropdownMenuItem onClick={() => cambiar("inactivo", "Marcado como inactivo")}>
              <UserX className="size-4" />
              Marcar como inactivo
            </DropdownMenuItem>
          )}
          {estatus !== "baja" && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmarBaja(true)}
            >
              <Ban className="size-4" />
              Dar de baja
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmarBaja}
        onOpenChange={setConfirmarBaja}
        titulo="¿Dar de baja al beneficiario?"
        descripcion="El beneficiario se marcará como baja. No se elimina ningún dato y podrás reactivarlo después."
        textoConfirmar="Dar de baja"
        destructivo
        onConfirm={() => cambiar("baja", "Beneficiario dado de baja")}
      />
    </>
  )
}
