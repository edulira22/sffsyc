import Link from "next/link"
import { UserCog, GraduationCap, Presentation, ArrowRight } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Catálogos" }

const CATALOGOS = [
  {
    href: "/catalogos/coordinadoras",
    titulo: "Coordinadoras",
    descripcion: "Coordinadoras generales, de zona y de centro.",
    icono: UserCog,
  },
  {
    href: "/catalogos/clases",
    titulo: "Clases",
    descripcion: "Catálogo estandarizado de clases por categoría.",
    icono: GraduationCap,
  },
  {
    href: "/catalogos/profesores",
    titulo: "Profesores",
    descripcion: "Profesores que imparten clases en los centros.",
    icono: Presentation,
  },
]

export default async function CatalogosPage() {
  await requerirRol(["admin", "coordinacion_general"])

  return (
    <div>
      <PageHeader
        titulo="Catálogos"
        descripcion="Información base del sistema. Mantenla actualizada para registrar centros y clases."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOGOS.map((c) => {
          const Icono = c.icono
          return (
            <Link key={c.href} href={c.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full items-start gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-agua-50 text-agua">
                    <Icono className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{c.titulo}</h3>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.descripcion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
