"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react"
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
import { CoordinadoraFormDialog } from "@/components/catalogos/coordinadora-form-dialog"
import { ROL_COORDINADORA_LABEL } from "@/lib/schemas/coordinadora"
import { cambiarEstatusCoordinadora } from "@/app/(app)/catalogos/coordinadoras/actions"
import type { CoordinadoraConZona } from "@/lib/data/coordinadoras"

export function CoordinadorasTabla({
  coordinadoras,
  zonas,
}: {
  coordinadoras: CoordinadoraConZona[]
  zonas: Pick<Zona, "id" | "nombre">[]
}) {
  const router = useRouter()
  const [editando, setEditando] = useState<CoordinadoraConZona | null>(null)
  const [desactivando, setDesactivando] = useState<CoordinadoraConZona | null>(null)

  async function activar(c: CoordinadoraConZona) {
    const r = await cambiarEstatusCoordinadora(c.id, "activa")
    if (r.ok) {
      toast.success(r.mensaje ?? "Activada")
      router.refresh()
    } else {
      toast.error(r.error)
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coordinadoras.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  {c.nombre} {c.apellidoPaterno} {c.apellidoMaterno ?? ""}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ROL_COORDINADORA_LABEL[c.rol]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.zona?.nombre ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.telefono ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge estatus={c.estatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Acciones">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditando(c)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      {c.estatus === "activa" ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDesactivando(c)}
                        >
                          <PowerOff className="size-4" />
                          Desactivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => activar(c)}>
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

      {/* Edición */}
      <CoordinadoraFormDialog
        open={editando !== null}
        onOpenChange={(o) => !o && setEditando(null)}
        zonas={zonas}
        coordinadora={editando ?? undefined}
      />

      {/* Confirmación de desactivación */}
      <ConfirmDialog
        open={desactivando !== null}
        onOpenChange={(o) => !o && setDesactivando(null)}
        titulo="¿Desactivar coordinadora?"
        descripcion={
          desactivando
            ? `${desactivando.nombre} ${desactivando.apellidoPaterno} dejará de aparecer como activa. Podrás reactivarla después; no se elimina ningún dato.`
            : undefined
        }
        textoConfirmar="Desactivar"
        destructivo
        onConfirm={async () => {
          if (!desactivando) return
          const r = await cambiarEstatusCoordinadora(desactivando.id, "inactiva")
          if (r.ok) {
            toast.success(r.mensaje ?? "Desactivada")
            router.refresh()
          } else {
            toast.error(r.error)
          }
        }}
      />
    </>
  )
}
