import { notFound, redirect } from "next/navigation"

import { requerirRol } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { AsignarClaseForm } from "@/components/centros/asignar-clase-form"
import { GraduationCap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Asignar clase" }

export default async function AsignarClasePage({
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

  if (
    session.user.rol === "coordinadora_zona" &&
    centro.zonaId !== session.user.zonaId
  ) {
    redirect("/centros")
  }

  const [clases, profesores] = await Promise.all([
    prisma.catalogoClase.findMany({
      where: { estatus: "activa" },
      include: { categoria: true },
      orderBy: { nombreOficial: "asc" },
    }),
    prisma.profesor.findMany({
      where: { estatus: "activa" },
      orderBy: [{ apellidoPaterno: "asc" }, { nombre: "asc" }],
    }),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Asignar clase"
        descripcion={`Centro: ${centro.nombre}`}
      />

      {clases.length === 0 ? (
        <EmptyState
          icono={GraduationCap}
          titulo="No hay clases en el catálogo"
          descripcion="Primero registra clases en el catálogo para poder asignarlas a un centro."
          accion={
            <Button asChild className="bg-agua hover:bg-agua-600">
              <Link href="/catalogos/clases">Ir al catálogo de clases</Link>
            </Button>
          }
        />
      ) : (
        <AsignarClaseForm
          centroId={centro.id}
          clases={clases}
          profesores={profesores}
        />
      )}
    </div>
  )
}
