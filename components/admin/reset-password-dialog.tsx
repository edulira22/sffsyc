"use client"

import { useState } from "react"
import { Loader2, KeyRound } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetearPassword } from "@/app/(app)/admin/usuarios/actions"

export function ResetPasswordDialog({
  open,
  onOpenChange,
  usuarioId,
  usuarioNombre,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuarioId: number | null
  usuarioNombre: string
}) {
  const [password, setPassword] = useState("")
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (usuarioId === null) return
    setGuardando(true)
    try {
      const r = await resetearPassword(usuarioId, { password })
      if (r.ok) {
        toast.success("Contraseña actualizada", {
          description: "Comparte la nueva contraseña con el usuario de forma segura.",
        })
        setPassword("")
        onOpenChange(false)
      } else {
        toast.error(r.error)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setPassword("")
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Restablecer contraseña
          </DialogTitle>
          <DialogDescription>
            Define una nueva contraseña para {usuarioNombre}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="nueva-pass">Nueva contraseña</Label>
          <Input
            id="nueva-pass"
            type="text"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={guardar}
            disabled={password.length < 8 || guardando}
            className="bg-agua hover:bg-agua-600"
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Guardar contraseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
