"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"

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
import { ProfesorFormDialog } from "@/components/catalogos/profesor-form-dialog"
import { cambiarEstatusProfesor } from "@/app/(app)/catalogos/profesores/actions"
import type { ProfesorListado } from "@/lib/data/profesores"

export function ProfesoresTabla({ profesores }: { profesores: ProfesorListado[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState<ProfesorListado | null>(null)
  const [desactivando, setDesactivando] = useState<ProfesorListado | null>(null)

  async function activar(p: ProfesorListado) {
    const r = await cambiarEstatusProfesor(p.id, "activa")
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
              <TableHead>Especialidad</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profesores.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno ?? ""}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.especialidad ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.telefono ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge estatus={p.estatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Acciones">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditando(p)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      {p.estatus === "activa" ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDesactivando(p)}
                        >
                          <PowerOff className="size-4" />
                          Desactivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => activar(p)}>
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

      <ProfesorFormDialog
        open={editando !== null}
        onOpenChange={(o) => !o && setEditando(null)}
        profesor={editando ?? undefined}
      />

      <ConfirmDialog
        open={desactivando !== null}
        onOpenChange={(o) => !o && setDesactivando(null)}
        titulo="¿Desactivar profesor?"
        descripcion={
          desactivando
            ? `${desactivando.nombre} ${desactivando.apellidoPaterno} dejará de aparecer como activo. No se elimina ningún dato.`
            : undefined
        }
        textoConfirmar="Desactivar"
        destructivo
        onConfirm={async () => {
          if (!desactivando) return
          const r = await cambiarEstatusProfesor(desactivando.id, "inactiva")
          if (r.ok) {
            toast.success(r.mensaje ?? "Desactivado")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </>
  )
}
