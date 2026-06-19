import { requerirRol } from "@/lib/session"
import {
  zonasConCoordinadora,
  coordinadorasDeCentroActivas,
} from "@/lib/data/centros"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { CentroForm } from "@/components/centros/centro-form"

export const metadata = { title: "Nuevo centro" }

export default async function NuevoCentroPage() {
  const session = await requerirRol([
    "admin",
    "coordinacion_general",
    "coordinadora_zona",
  ])

  const [zonas, coordinadoras] = await Promise.all([
    zonasConCoordinadora(),
    coordinadorasDeCentroActivas(),
  ])

  const zonaBloqueada =
    session.user.rol === "coordinadora_zona" ? session.user.zonaId : null

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Nuevo centro"
        descripcion="Registra un centro comunitario o CEDEFAM."
      />
      <CentroForm
        zonas={zonas}
        coordinadoras={coordinadoras}
        zonaBloqueada={zonaBloqueada}
      />
    </div>
  )
}
