import { notFound, redirect } from "next/navigation"

import { requerirRol } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import {
  zonasConCoordinadora,
  coordinadorasDeCentroActivas,
} from "@/lib/data/centros"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { CentroForm } from "@/components/centros/centro-form"

export const metadata = { title: "Editar centro" }

export default async function EditarCentroPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requerirRol([
    "admin",
    "coordinacion_general",
    "coordinadora_zona",
  ])

  const id = Number(params.id)
  if (!Number.isInteger(id)) notFound()

  const centro = await prisma.centro.findUnique({ where: { id } })
  if (!centro) notFound()

  // La coordinadora de zona solo edita centros de su zona.
  if (
    session.user.rol === "coordinadora_zona" &&
    centro.zonaId !== session.user.zonaId
  ) {
    redirect("/centros")
  }

  const [zonas, coordinadoras] = await Promise.all([
    zonasConCoordinadora(),
    coordinadorasDeCentroActivas(),
  ])

  const zonaBloqueada =
    session.user.rol === "coordinadora_zona" ? session.user.zonaId : null

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader titulo="Editar centro" descripcion={centro.nombre} />
      <CentroForm
        zonas={zonas}
        coordinadoras={coordinadoras}
        centro={centro}
        zonaBloqueada={zonaBloqueada}
      />
    </div>
  )
}
