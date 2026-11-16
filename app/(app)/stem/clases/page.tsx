import { quienStem } from "@/lib/stem/acceso"
import { listarClases } from "@/lib/data/stem"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { ClasesStem } from "@/components/stem/clases-stem"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Clases · Centro STEM" }

export default async function ClasesStemPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const clases = await listarClases()
  return (
    <div>
      <PageHeader titulo="Clases" descripcion="El catálogo de lo que se enseña. Al abrir un curso eliges una de estas clases." />
      <ClasesStem clases={clases} />
    </div>
  )
}
