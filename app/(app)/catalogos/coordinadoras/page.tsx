import { UserCog } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { parseFiltroCatalogo } from "@/lib/data/filtros"
import { listarCoordinadoras, listarZonas } from "@/lib/data/coordinadoras"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { ListToolbar } from "@/components/ui-patterns/list-toolbar"
import { PaginationNav } from "@/components/ui-patterns/pagination-nav"
import { CoordinadorasTabla } from "@/components/catalogos/coordinadoras-tabla"
import { NuevaCoordinadoraButton } from "@/components/catalogos/nueva-coordinadora-button"

export const metadata = { title: "Coordinadoras" }

export default async function CoordinadorasPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  await requerirRol(["admin", "coordinacion_general"])

  const filtro = parseFiltroCatalogo(searchParams)
  const [{ items, total, page, totalPages }, zonas] = await Promise.all([
    listarCoordinadoras(filtro),
    listarZonas(),
  ])

  const hayFiltros = Boolean(filtro.q || filtro.estatus)

  return (
    <div>
      <PageHeader
        titulo="Coordinadoras"
        descripcion="Catálogo de coordinadoras de la Subdirección."
        acciones={<NuevaCoordinadoraButton zonas={zonas} />}
      />

      <ListToolbar placeholder="Buscar por nombre o apellido…" />

      {total === 0 ? (
        <EmptyState
          icono={UserCog}
          titulo={
            hayFiltros
              ? "Sin resultados"
              : "Aún no hay coordinadoras registradas"
          }
          descripcion={
            hayFiltros
              ? "Prueba con otro término de búsqueda o cambia el filtro de estatus."
              : "Registra la primera coordinadora para comenzar."
          }
        />
      ) : (
        <>
          <CoordinadorasTabla coordinadoras={items} zonas={zonas} />
          <PaginationNav page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  )
}
