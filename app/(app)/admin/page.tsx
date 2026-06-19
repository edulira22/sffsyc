import Link from "next/link"
import { Users, MapPin, ArrowRight } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Administración" }

const SECCIONES = [
  {
    href: "/admin/usuarios",
    titulo: "Usuarios del sistema",
    descripcion: "Crear cuentas, asignar roles y restablecer contraseñas.",
    icono: Users,
  },
  {
    href: "/admin/zonas",
    titulo: "Zonas",
    descripcion: "Las cuatro zonas de la Subdirección y su coordinación.",
    icono: MapPin,
  },
]

export default async function AdminPage() {
  await requerirRol(["admin"])

  return (
    <div>
      <PageHeader
        titulo="Administración"
        descripcion="Configuración del sistema (solo administrador)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((s) => {
          const Icono = s.icono
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full items-start gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gobierno-50 text-gobierno">
                    <Icono className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{s.titulo}</h3>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.descripcion}
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
