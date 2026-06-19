import Link from "next/link"
import { Users, Plus } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import {
  listarBeneficiarios,
  opcionesFiltroBeneficiarios,
} from "@/lib/data/beneficiarios"
import { calcularEdad } from "@/lib/fechas"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { PaginationNav } from "@/components/ui-patterns/pagination-nav"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BeneficiariosFiltros } from "@/components/beneficiarios/beneficiarios-filtros"

export const metadata = { title: "Beneficiarios" }

export default async function BeneficiariosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await requerirSesion()
  const esZona = session.user.rol === "coordinadora_zona"
  const zonaId = esZona ? session.user.zonaId ?? -1 : undefined

  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : undefined
  const centroId =
    typeof searchParams.centro === "string" && Number(searchParams.centro)
      ? Number(searchParams.centro)
      : undefined
  const claseId =
    typeof searchParams.clase === "string" && Number(searchParams.clase)
      ? Number(searchParams.clase)
      : undefined
  const page = Math.max(1, Number(searchParams.page) || 1)

  const [{ items, total, totalPages }, opciones] = await Promise.all([
    listarBeneficiarios({ q, centroId, claseId, zonaId, page, pageSize: 15 }),
    opcionesFiltroBeneficiarios(zonaId),
  ])

  const hayFiltros = Boolean(q || centroId || claseId)

  return (
    <div>
      <PageHeader
        titulo="Beneficiarios"
        descripcion="Registro único de personas beneficiarias."
        acciones={
          <Button asChild className="bg-agua hover:bg-agua-600">
            <Link href="/beneficiarios/nuevo">
              <Plus className="size-4" />
              Nuevo beneficiario
            </Link>
          </Button>
        }
      />

      <BeneficiariosFiltros centros={opciones.centros} clases={opciones.clases} />

      {total === 0 ? (
        <EmptyState
          icono={Users}
          titulo={hayFiltros ? "Sin resultados" : "Aún no hay beneficiarios"}
          descripcion={
            hayFiltros
              ? "Prueba con otro término o cambia los filtros."
              : "Registra al primer beneficiario. El sistema buscará duplicados antes de crearlo."
          }
          accion={
            !hayFiltros ? (
              <Button asChild className="bg-agua hover:bg-agua-600">
                <Link href="/beneficiarios/nuevo">
                  <Plus className="size-4" />
                  Nuevo beneficiario
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Edad</TableHead>
                  <TableHead>Centros</TableHead>
                  <TableHead className="text-center">Clases</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => {
                  const centros = Array.from(
                    new Set(
                      b.inscripciones.map((i) => i.claseCentro.centro.nombre)
                    )
                  )
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/beneficiarios/${b.id}`}
                          className="hover:text-agua-700 hover:underline"
                        >
                          {b.nombres} {b.apellidoPaterno} {b.apellidoMaterno ?? ""}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {calcularEdad(b.fechaNacimiento)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {centros.length > 0 ? centros.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {b.inscripciones.length}
                      </TableCell>
                      <TableCell>
                        <StatusBadge estatus={b.estatus} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationNav page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  )
}
