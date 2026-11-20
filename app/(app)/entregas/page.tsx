import { listarCampanas } from "@/lib/data/entregas"
import { hoyChihuahua } from "@/lib/entregas/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { CampanasLista } from "@/components/entregas/campanas-lista"

export const metadata = { title: "Entregas" }

export default async function EntregasPage() {
  const campanas = await listarCampanas()
  return (
    <div>
      <PageHeader
        titulo="Entregas"
        descripcion="Apoyos en especie que se entregan cada año: solicitudes, cuánto se autoriza, a quién se avisó y qué ya se entregó."
      />
      <CampanasLista campanas={campanas} anio={Number(hoyChihuahua().slice(0, 4))} />
    </div>
  )
}
