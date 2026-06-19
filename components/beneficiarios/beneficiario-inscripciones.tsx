"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, GraduationCap, MoreHorizontal, Ban } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { InscripcionDialog } from "@/components/beneficiarios/inscripcion-dialog"
import { formatoFecha } from "@/lib/fechas"
import { cambiarEstatusInscripcion } from "@/app/(app)/beneficiarios/actions"
import type { BeneficiarioDetalle, CentroConClases } from "@/lib/data/beneficiarios"

type Inscripcion = BeneficiarioDetalle["inscripciones"][number]

const DIA_ABBR: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
}

function horario(ins: Inscripcion) {
  const h = ins.claseCentro.horarios
  if (h.length === 0) return "Sin horario"
  return h
    .map((x) => `${DIA_ABBR[x.diaSemana] ?? x.diaSemana} ${x.horaInicio}–${x.horaFin}`)
    .join(", ")
}

export function BeneficiarioInscripciones({
  beneficiarioId,
  inscripciones,
  centros,
  puedeEditar,
}: {
  beneficiarioId: number
  inscripciones: Inscripcion[]
  centros: CentroConClases[]
  puedeEditar: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dialogo, setDialogo] = useState(false)
  const [baja, setBaja] = useState<Inscripcion | null>(null)

  // Tras registrar, la ficha llega con ?inscribir=1 y abre el diálogo.
  useEffect(() => {
    if (puedeEditar && searchParams.get("inscribir") === "1") {
      setDialogo(true)
      router.replace(`/beneficiarios/${beneficiarioId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activas = inscripciones.filter((i) => i.estatus === "activa")
  const historial = inscripciones.filter((i) => i.estatus !== "activa")

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Inscripciones activas
            </h2>
            {puedeEditar && activas.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogo(true)}
              >
                <Plus className="size-4" />
                Nueva inscripción
              </Button>
            )}
          </div>

          {activas.length === 0 ? (
            <EmptyState
              icono={GraduationCap}
              titulo="Sin inscripciones activas"
              descripcion="Este beneficiario no está inscrito en ninguna clase."
              accion={
                puedeEditar ? (
                  <Button
                    className="bg-agua hover:bg-agua-600"
                    onClick={() => setDialogo(true)}
                  >
                    <Plus className="size-4" />
                    Nueva inscripción
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Clase</TableHead>
                    <TableHead>Centro</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Inscripción</TableHead>
                    {puedeEditar && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activas.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-medium">
                        {ins.claseCentro.clase.nombreOficial}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ins.claseCentro.centro.nombre}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {horario(ins)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatoFecha(ins.fechaInscripcion)}
                      </TableCell>
                      {puedeEditar && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Acciones"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setBaja(ins)}
                              >
                                <Ban className="size-4" />
                                Dar de baja
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {historial.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Historial de inscripciones
            </h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Clase</TableHead>
                    <TableHead>Centro</TableHead>
                    <TableHead>Inscripción</TableHead>
                    <TableHead>Estatus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-medium">
                        {ins.claseCentro.clase.nombreOficial}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ins.claseCentro.centro.nombre}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatoFecha(ins.fechaInscripcion)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge estatus={ins.estatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <InscripcionDialog
        beneficiarioId={beneficiarioId}
        centros={centros}
        open={dialogo}
        onOpenChange={setDialogo}
      />

      <ConfirmDialog
        open={baja !== null}
        onOpenChange={(o) => !o && setBaja(null)}
        titulo="¿Dar de baja la inscripción?"
        descripcion={
          baja
            ? `Se dará de baja de "${baja.claseCentro.clase.nombreOficial}" en ${baja.claseCentro.centro.nombre}. Quedará en el historial.`
            : undefined
        }
        textoConfirmar="Dar de baja"
        destructivo
        onConfirm={async () => {
          if (!baja) return
          const r = await cambiarEstatusInscripcion(baja.id, beneficiarioId, "baja")
          if (r.ok) {
            toast.success(r.mensaje ?? "Dada de baja")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </>
  )
}
