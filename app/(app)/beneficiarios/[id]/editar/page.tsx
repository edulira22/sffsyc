import { notFound } from "next/navigation"

import { requerirSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { BeneficiarioForm } from "@/components/beneficiarios/beneficiario-form"

export const metadata = { title: "Editar beneficiario" }

export default async function EditarBeneficiarioPage({
  params,
}: {
  params: { id: string }
}) {
  await requerirSesion()

  const id = Number(params.id)
  if (!Number.isInteger(id)) notFound()

  const beneficiario = await prisma.beneficiario.findUnique({ where: { id } })
  if (!beneficiario) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Editar beneficiario"
        descripcion={`${beneficiario.nombres} ${beneficiario.apellidoPaterno}`}
      />
      <BeneficiarioForm beneficiario={beneficiario} />
    </div>
  )
}
