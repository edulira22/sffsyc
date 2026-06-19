import Link from "next/link"
import {
  Building2,
  Users,
  GraduationCap,
  ArrowRight,
  UserPlus,
  FileSpreadsheet,
  Cake,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { NOMBRE_ROL, puedeGestionarCatalogos } from "@/lib/permisos"
import { prisma } from "@/lib/prisma"
import { metricasDashboard } from "@/lib/data/dashboard"
import { calcularEdad } from "@/lib/fechas"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui-patterns/status-badge"

function TarjetaMetrica({
  href,
  icono: Icono,
  valor,
  etiqueta,
  color,
}: {
  href: string
  icono: typeof Building2
  valor: number
  etiqueta: string
  color: string
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`flex size-12 items-center justify-center rounded-xl ${color}`}>
            <Icono className="size-6" />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground">{valor}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              {etiqueta}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function DashboardPage() {
  const session = await requerirSesion()
  const esZona = session.user.rol === "coordinadora_zona"
  const zonaId = esZona ? session.user.zonaId ?? -1 : undefined

  const { centrosActivos, clasesActivas, beneficiariosActivos, ultimos } =
    await metricasDashboard(zonaId)

  let zonaNombre: string | null = null
  if (esZona && session.user.zonaId) {
    const z = await prisma.zona.findUnique({ where: { id: session.user.zonaId } })
    zonaNombre = z?.nombre ?? null
  }

  const accesos = [
    { href: "/centros", titulo: "Ver centros", icono: Building2 },
    { href: "/beneficiarios/nuevo", titulo: "Registrar beneficiario", icono: UserPlus },
    ...(puedeGestionarCatalogos(session.user.rol)
      ? [{ href: "/datos", titulo: "Importar / Exportar", icono: FileSpreadsheet }]
      : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Hola, ${session.user.nombre.split(" ")[0]}`}
        descripcion={
          esZona && zonaNombre
            ? `${NOMBRE_ROL[session.user.rol]} · Zona ${zonaNombre}`
            : `Has iniciado sesión como ${NOMBRE_ROL[session.user.rol]}.`
        }
      />

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaMetrica
          href="/centros"
          icono={Building2}
          valor={centrosActivos}
          etiqueta="Centros activos"
          color="bg-gobierno-50 text-gobierno"
        />
        <TarjetaMetrica
          href="/beneficiarios"
          icono={Users}
          valor={beneficiariosActivos}
          etiqueta="Beneficiarios activos"
          color="bg-agua-50 text-agua"
        />
        <TarjetaMetrica
          href="/centros"
          icono={GraduationCap}
          valor={clasesActivas}
          etiqueta="Clases activas"
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Últimos beneficiarios */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Últimos beneficiarios registrados
              </h2>
              <Link
                href="/beneficiarios"
                className="text-sm text-agua-700 hover:underline"
              >
                Ver todos
              </Link>
            </div>

            {ultimos.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Aún no hay beneficiarios registrados.
              </p>
            ) : (
              <ul className="divide-y">
                {ultimos.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/beneficiarios/${b.id}`}
                      className="flex items-center justify-between gap-2 py-2.5 hover:bg-muted/30"
                    >
                      <span className="font-medium text-foreground">
                        {b.nombres} {b.apellidoPaterno} {b.apellidoMaterno ?? ""}
                      </span>
                      <span className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Cake className="size-3.5" />
                          {calcularEdad(b.fechaNacimiento)} años
                        </span>
                        <StatusBadge estatus={b.estatus} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Accesos rápidos
            </h2>
            <div className="space-y-2">
              {accesos.map((a) => {
                const Icono = a.icono
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm font-medium text-foreground transition-colors hover:border-agua/40 hover:bg-agua-50"
                  >
                    <Icono className="size-4 text-agua" />
                    {a.titulo}
                    <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
