"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Power, PowerOff } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { cambiarEstatusClaseCentro } from "@/app/(app)/centros/actions"
import type { CentroDetalle } from "@/lib/data/centros"

type ClaseCentro = CentroDetalle["clasesCentro"][number]

const DIA_ABBR: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
}

function formatoHorario(cc: ClaseCentro) {
  if (cc.horarios.length === 0) return "Sin horario"
  return cc.horarios
    .map((h) => `${DIA_ABBR[h.diaSemana] ?? h.diaSemana} ${h.horaInicio}–${h.horaFin}`)
    .join(" · ")
}

export function ClasesCentroTabla({
  clases,
  centroId,
  puedeEditar,
}: {
  clases: ClaseCentro[]
  centroId: number
  puedeEditar: boolean
}) {
  const router = useRouter()
  const [retirando, setRetirando] = useState<ClaseCentro | null>(null)

  async function reactivar(cc: ClaseCentro) {
    const r = await cambiarEstatusClaseCentro(cc.id, centroId, "activa")
    if (r.ok) {
      toast.success(r.mensaje ?? "Reactivada")
      router.refresh()
    } else toast.error(r.error)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Clase</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead className="text-center">Inscritos</TableHead>
              <TableHead>Estatus</TableHead>
              {puedeEditar && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clases.map((cc) => {
              const inscritos = new Set(
                cc.inscripciones.map((i) => i.beneficiarioId)
              ).size
              return (
                <TableRow key={cc.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {cc.clase.nombreOficial}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {cc.clase.categoria.nombre}
                      </Badge>
                      {cc.nivelGrupo && (
                        <span className="text-xs text-muted-foreground">
                          {cc.nivelGrupo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cc.profesor
                      ? `${cc.profesor.nombre} ${cc.profesor.apellidoPaterno}`
                      : "Sin asignar"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatoHorario(cc)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {inscritos}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estatus={cc.estatus} />
                  </TableCell>
                  {puedeEditar && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Acciones">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cc.estatus === "activa" ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRetirando(cc)}
                            >
                              <PowerOff className="size-4" />
                              Retirar del centro
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => reactivar(cc)}>
                              <Power className="size-4" />
                              Reactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={retirando !== null}
        onOpenChange={(o) => !o && setRetirando(null)}
        titulo="¿Retirar clase del centro?"
        descripcion={
          retirando
            ? `"${retirando.clase.nombreOficial}" dejará de estar activa en este centro. Las inscripciones existentes se conservan; podrás reactivarla después.`
            : undefined
        }
        textoConfirmar="Retirar"
        destructivo
        onConfirm={async () => {
          if (!retirando) return
          const r = await cambiarEstatusClaseCentro(retirando.id, centroId, "inactiva")
          if (r.ok) {
            toast.success(r.mensaje ?? "Retirada")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </>
  )
}
