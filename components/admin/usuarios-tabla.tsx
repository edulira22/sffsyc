"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, KeyRound, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import type { Zona } from "@prisma/client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { UsuarioFormDialog } from "@/components/admin/usuario-form-dialog"
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog"
import { NOMBRE_ROL } from "@/lib/permisos"
import { cambiarEstatusUsuario } from "@/app/(app)/admin/usuarios/actions"
import type { UsuarioListado } from "@/lib/data/usuarios"

export function UsuariosTabla({
  usuarios,
  zonas,
}: {
  usuarios: UsuarioListado[]
  zonas: Pick<Zona, "id" | "nombre">[]
}) {
  const router = useRouter()
  const [editando, setEditando] = useState<UsuarioListado | null>(null)
  const [reseteando, setReseteando] = useState<UsuarioListado | null>(null)
  const [desactivando, setDesactivando] = useState<UsuarioListado | null>(null)

  async function activar(u: UsuarioListado) {
    const r = await cambiarEstatusUsuario(u.id, "activo")
    if (r.ok) {
      toast.success(r.mensaje ?? "Activado")
      router.refresh()
    } else toast.error(r.error)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {NOMBRE_ROL[u.rol]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.zona?.nombre ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge estatus={u.estatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Acciones">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditando(u)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReseteando(u)}>
                        <KeyRound className="size-4" />
                        Restablecer contraseña
                      </DropdownMenuItem>
                      {u.estatus === "activo" ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDesactivando(u)}
                        >
                          <PowerOff className="size-4" />
                          Desactivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => activar(u)}>
                          <Power className="size-4" />
                          Activar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UsuarioFormDialog
        open={editando !== null}
        onOpenChange={(o) => !o && setEditando(null)}
        zonas={zonas}
        usuario={editando ?? undefined}
      />

      <ResetPasswordDialog
        open={reseteando !== null}
        onOpenChange={(o) => !o && setReseteando(null)}
        usuarioId={reseteando?.id ?? null}
        usuarioNombre={reseteando?.nombre ?? ""}
      />

      <ConfirmDialog
        open={desactivando !== null}
        onOpenChange={(o) => !o && setDesactivando(null)}
        titulo="¿Desactivar usuario?"
        descripcion={
          desactivando
            ? `${desactivando.nombre} ya no podrá iniciar sesión. Puedes reactivarlo después.`
            : undefined
        }
        textoConfirmar="Desactivar"
        destructivo
        onConfirm={async () => {
          if (!desactivando) return
          const r = await cambiarEstatusUsuario(desactivando.id, "inactivo")
          if (r.ok) {
            toast.success(r.mensaje ?? "Desactivado")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </>
  )
}
