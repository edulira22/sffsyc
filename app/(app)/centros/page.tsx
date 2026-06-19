import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import type { EstatusCentro, TipoCentro } from "@prisma/client"

import { requerirSesion } from "@/lib/session"
import { puedeEditarCentros } from "@/lib/permisos"
import { listarCentros } from "@/lib/data/centros"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { PaginationNav } from "@/components/ui-patterns/pagination-nav"
import { Button } from "@/components/ui/button"
import { CentrosFiltros } from "@/components/centros/centros-filtros"
import { CentroCard } from "@/components/centros/centro-card"

export const metadata = { title: "Centros" }

const ESTATUS_VALIDOS: EstatusCentro[] = ["activo", "inactivo", "pendiente"]
const TIPOS_VALIDOS: TipoCentro[] = ["centro_comunitario", "cedefam"]

export default async function CentrosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await requerirSesion()
  const esZona = session.user.rol === "coordinadora_zona"

  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : undefined
  const tipoRaw = typeof searchParams.tipo === "string" ? searchParams.tipo : undefined
  const estatusRaw =
    typeof searchParams.estatus === "string" ? searchParams.estatus : undefined
  const tipo = TIPOS_VALIDOS.includes(tipoRaw as TipoCentro)
    ? (tipoRaw as TipoCentro)
    : undefined
  const estatus = ESTATUS_VALIDOS.includes(estatusRaw as EstatusCentro)
    ? (estatusRaw as EstatusCentro)
    : undefined
  const page = Math.max(1, Number(searchParams.page) || 1)

  // La coordinadora de zona queda fijada a su zona; los demás pueden filtrar.
  let zonaId: number | undefined
  if (esZona) {
    zonaId = session.user.zonaId ?? -1
  } else if (typeof searchParams.zona === "string" && Number(searchParams.zona)) {
    zonaId = Number(searchParams.zona)
  }

  const { items, total, totalPages } = await listarCentros({
    q,
    tipo,
    estatus,
    zonaId,
    page,
    pageSize: 500,
  })

  const zonas = esZona
    ? undefined
    : await prisma.zona.findMany({ orderBy: { nombre: "asc" } })

  const hayFiltros = Boolean(q || tipo || estatus || (!esZona && zonaId))
  const puedeCrear = puedeEditarCentros(session.user.rol)

  return (
    <div>
      <PageHeader
        titulo="Centros"
        descripcion="Centros comunitarios y CEDEFAM de la Subdirección."
        acciones={
          puedeCrear ? (
            <Button asChild className="bg-agua hover:bg-agua-600">
              <Link href="/centros/nuevo">
                <Plus className="size-4" />
                Nuevo centro
              </Link>
            </Button>
          ) : undefined
        }
      />

      <CentrosFiltros zonas={zonas} />

      {total === 0 ? (
        <EmptyState
          icono={Building2}
          titulo={hayFiltros ? "Sin resultados" : "Aún no hay centros registrados"}
          descripcion={
            hayFiltros
              ? "Prueba con otros filtros o términos de búsqueda."
              : "Registra el primer centro para comenzar a organizar clases y beneficiarios."
          }
          accion={
            !hayFiltros && puedeCrear ? (
              <Button asChild className="bg-agua hover:bg-agua-600">
                <Link href="/centros/nuevo">
                  <Plus className="size-4" />
                  Nuevo centro
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((centro) => (
              <CentroCard key={centro.id} centro={centro} />
            ))}
          </div>
          <PaginationNav page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  )
}
