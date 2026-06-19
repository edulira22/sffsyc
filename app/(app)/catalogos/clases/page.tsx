import { GraduationCap } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { parseFiltroCatalogo } from "@/lib/data/filtros"
import { listarClases, listarCategoriasActivas } from "@/lib/data/clases"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { ListToolbar } from "@/components/ui-patterns/list-toolbar"
import { PaginationNav } from "@/components/ui-patterns/pagination-nav"
import { ClasesTabla } from "@/components/catalogos/clases-tabla"
import { NuevaClaseButton } from "@/components/catalogos/nueva-clase-button"

export const metadata = { title: "Clases" }

export default async function ClasesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  await requerirRol(["admin", "coordinacion_general"])

  const filtro = parseFiltroCatalogo(searchParams)
  const [{ items, total, page, totalPages }, categorias] = await Promise.all([
    listarClases(filtro),
    listarCategoriasActivas(),
  ])

  const hayFiltros = Boolean(filtro.q || filtro.estatus)

  return (
    <div>
      <PageHeader
        titulo="Clases"
        descripcion="Catálogo estandarizado de clases por categoría."
        acciones={<NuevaClaseButton categorias={categorias} />}
      />

      <ListToolbar placeholder="Buscar por nombre o alias…" />

      {total === 0 ? (
        <EmptyState
          icono={GraduationCap}
          titulo={hayFiltros ? "Sin resultados" : "Aún no hay clases registradas"}
          descripcion={
            hayFiltros
              ? "Prueba con otro término o cambia el filtro de estatus."
              : "Registra la primera clase del catálogo para comenzar."
          }
        />
      ) : (
        <>
          <ClasesTabla clases={items} categorias={categorias} />
          <PaginationNav page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  )
}
