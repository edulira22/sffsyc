import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Users } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { RegistradorMasivo } from "@/components/centros/registrador-masivo"
import type { ClaseOpcion } from "@/components/centros/registrador-masivo"

export default async function RegistrarBeneficiariosPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requerirSesion()
  const id = Number(params.id)
  if (!Number.isInteger(id)) notFound()

  const centro = await prisma.centro.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      zonaId: true,
      estatus: true,
      clasesCentro: {
        where: { estatus: "activa" },
        select: {
          id: true,
          clase: {
            select: {
              nombreOficial: true,
              categoria: { select: { nombre: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!centro) notFound()

  // Coordinadora de zona solo accede a su zona.
  if (
    session.user.rol === "coordinadora_zona" &&
    centro.zonaId !== session.user.zonaId
  ) {
    redirect(`/centros/${id}`)
  }

  const clases: ClaseOpcion[] = centro.clasesCentro.map((cc) => ({
    id: cc.id,
    nombre: cc.clase.nombreOficial,
    categoria: cc.clase.categoria.nombre,
  }))

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <Link
          href={`/centros/${centro.id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {centro.nombre}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gobierno-50 text-gobierno">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Registrar beneficiarios
            </h1>
            <p className="text-sm text-muted-foreground">{centro.nombre}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          Llena los datos de cada persona. La CURP auto-calcula la fecha de
          nacimiento. Marca <strong>Sin CURP</strong>, <strong>Sin tel.</strong> o{" "}
          <strong>Sin dom.</strong> cuando el dato no se proporcionó. Todos los
          demás campos son obligatorios.
        </p>
      </div>

      <RegistradorMasivo
        centroId={centro.id}
        clases={clases}
      />
    </div>
  )
}
