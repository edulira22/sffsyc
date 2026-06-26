import Link from "next/link"
import { Users, ArrowRight } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Administración" }

export default async function AdminPage() {
  await requerirRol(["admin"])

  return (
    <div>
      <PageHeader
        titulo="Administración"
        descripcion="Gestión de usuarios del sistema."
      />
      <div className="max-w-sm">
        <Link href="/admin/usuarios" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gobierno-50 text-gobierno">
                <Users className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Usuarios del sistema</h3>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crear cuentas, dar acceso por sección y restablecer contraseñas.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
