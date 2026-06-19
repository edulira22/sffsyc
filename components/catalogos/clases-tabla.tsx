"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import type { CatalogoCategoria } from "@prisma/client"

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
import { ClaseFormDialog } from "@/components/catalogos/clase-form-dialog"
import { cambiarEstatusClase } from "@/app/(app)/catalogos/clases/actions"
import type { ClaseConCategoria } from "@/lib/data/clases"

export function ClasesTabla({
  clases,
  categorias,
}: {
  clases: ClaseConCategoria[]
  categorias: Pick<CatalogoCategoria, "id" | "nombre">[]
}) {
  const router = useRouter()
  const [editando, setEditando] = useState<ClaseConCategoria | null>(null)
  const [desactivando, setDesactivando] = useState<ClaseConCategoria | null>(null)

  async function activar(c: ClaseConCategoria) {
    const r = await cambiarEstatusClase(c.id, "activa")
    if (r.ok) {
      toast.success(r.mensaje ?? "Activada")
      router.refresh()
    } else toast.error(r.error)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nombre oficial</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Variantes / alias</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nombreOficial}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.categoria.nombre}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {c.variantesAlias ?? "—"}
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

      <ClaseFormDialog
        open={editando !== null}
        onOpenChange={(o) => !o && setEditando(null)}
        categorias={categorias}
        clase={editando ?? undefined}
      />

      <ConfirmDialog
        open={desactivando !== null}
        onOpenChange={(o) => !o && setDesactivando(null)}
        titulo="¿Desactivar clase?"
        descripcion={
          desactivando
            ? `"${desactivando.nombreOficial}" dejará de estar disponible para asignar a centros. No se elimina ningún dato.`
            : undefined
        }
        textoConfirmar="Desactivar"
        destructivo
        onConfirm={async () => {
          if (!desactivando) return
          const r = await cambiarEstatusClase(desactivando.id, "inactiva")
          if (r.ok) {
            toast.success(r.mensaje ?? "Desactivada")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </>
  )
}
