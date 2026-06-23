import { requerirSesion } from "@/lib/session"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { BeneficiarioForm } from "@/components/beneficiarios/beneficiario-form"

export const metadata = { title: "Nuevo beneficiario" }

export default async function NuevoBeneficiarioPage() {
  await requerirSesion()
  return (
    <div>
      <PageHeader
        titulo="Nuevo beneficiario"
        descripcion="Completa los datos del beneficiario. Si ya existe por CURP, el sistema lo detectará al guardar."
      />
      <BeneficiarioForm />
    </div>
  )
}
