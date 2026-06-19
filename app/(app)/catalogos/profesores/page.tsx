import { Presentation } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { parseFiltroCatalogo } from "@/lib/data/filtros"
import { listarProfesores } from "@/lib/data/profesores"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { ListToolbar } from "@/components/ui-patterns/list-toolbar"
import { PaginationNav } from "@/components/ui-patterns/pagination-nav"
import { ProfesoresTabla } from "@/components/catalogos/profesores-tabla"
import { NuevaProfesorButton } from "@/components/catalogos/nueva-profesor-button"

export const metadata = { title: "Profesores" }

export default async function ProfesoresPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  await requerirRol(["admin", "coordinacion_general"])

  const filtro = parseFiltroCatalogo(searchParams)
  const { items, total, page, totalPages } = await listarProfesores(filtro)

  const hayFiltros = Boolean(filtro.q || filtro.estatus)

  return (
    <div>
      <PageHeader
        titulo="Profesores"
        descripcion="Catálogo de profesores que imparten clases."
        acciones={<NuevaProfesorButton />}
      />

      <ListToolbar placeholder="Buscar por nombre o especialidad…" />

      {total === 0 ? (
        <EmptyState
          icono={Presentation}
          titulo={hayFiltros ? "Sin resultados" : "Aún no hay profesores registrados"}
          descripcion={
            hayFiltros
              ? "Prueba con otro término o cambia el filtro de estatus."
              : "Registra al primer profesor para comenzar."
          }
        />
      ) : (
        <>
          <ProfesoresTabla profesores={items} />
          <PaginationNav page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  )
}
