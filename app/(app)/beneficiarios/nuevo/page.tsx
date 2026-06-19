import { requerirSesion } from "@/lib/session"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { BuscarYRegistrar } from "@/components/beneficiarios/buscar-y-registrar"

export const metadata = { title: "Nuevo beneficiario" }

export default async function NuevoBeneficiarioPage() {
  await requerirSesion()
  return (
    <div>
      <PageHeader
        titulo="Nuevo beneficiario"
        descripcion="Antes de registrar, buscamos posibles duplicados."
      />
      <BuscarYRegistrar />
    </div>
  )
}
