import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  Pencil,
  Plus,
  MapPin,
  Clock,
  UserCog,
  Users,
  GraduationCap,
  ArrowRight,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { puedeEditarCentros } from "@/lib/permisos"
import { obtenerCentro, coordinadoraDeZona } from "@/lib/data/centros"
import { TIPO_CENTRO_LABEL } from "@/lib/schemas/centro"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { ClasesCentroTabla } from "@/components/centros/clases-centro-tabla"
import { CentroEstatusMenu } from "@/components/centros/centro-estatus-menu"

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof MapPin
  etiqueta: string
  valor: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
        <p className="text-sm text-foreground">{valor}</p>
      </div>
    </div>
  )
}

export default async function CentroFichaPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requerirSesion()
  const id = Number(params.id)
  if (!Number.isInteger(id)) notFound()

  const centro = await obtenerCentro(id)
  if (!centro) notFound()

  // La coordinadora de zona solo ve centros de su zona.
  if (
    session.user.rol === "coordinadora_zona" &&
    centro.zonaId !== session.user.zonaId
  ) {
    redirect("/centros")
  }

  const coordZona = await coordinadoraDeZona(centro.zonaId)
  const puedeEditar = puedeEditarCentros(session.user.rol)

  const totalBeneficiarios = new Set(
    centro.clasesCentro.flatMap((cc) =>
      cc.inscripciones.map((i) => i.beneficiarioId)
    )
  ).size
  const clasesActivas = centro.clasesCentro.filter(
    (cc) => cc.estatus === "activa"
  ).length

  const coordinadoraCentro = centro.coordinadora
    ? `${centro.coordinadora.nombre} ${centro.coordinadora.apellidoPaterno} ${centro.coordinadora.apellidoMaterno ?? ""}`.trim()
    : "Sin asignar"

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/centros"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Centros
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {centro.nombre}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TIPO_CENTRO_LABEL[centro.tipo]}</Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" />
              Zona {centro.zona.nombre}
            </Badge>
            <StatusBadge estatus={centro.estatus} />
          </div>
        </div>

        {puedeEditar && (
          <div className="flex flex-wrap items-center gap-2">
            <CentroEstatusMenu centroId={centro.id} estatus={centro.estatus} />
            <Button asChild variant="outline">
              <Link href={`/centros/${centro.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <Button asChild className="bg-agua hover:bg-agua-600">
              <Link href={`/centros/${centro.id}/clases/nueva`}>
                <Plus className="size-4" />
                Asignar clase
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-agua-50 text-agua">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{clasesActivas}</p>
              <p className="text-sm text-muted-foreground">Clases activas</p>
            </div>
          </CardContent>
        </Card>
        <Link href={`/beneficiarios?centro=${centro.id}`} className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gobierno-50 text-gobierno">
                <Users className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">
                  {totalBeneficiarios}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  Beneficiarios inscritos
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Información general */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Información general
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Dato
              icono={MapPin}
              etiqueta="Dirección"
              valor={centro.direccion || "No registrada"}
            />
            <Dato
              icono={MapPin}
              etiqueta="Referencia"
              valor={centro.referenciaUbicacion || "No registrada"}
            />
            <Dato
              icono={Clock}
              etiqueta="Horario general"
              valor={centro.horarioGeneral || "No registrado"}
            />
            <Dato
              icono={UserCog}
              etiqueta="Coordinadora del centro"
              valor={coordinadoraCentro}
            />
            <Dato
              icono={UserCog}
              etiqueta="Coordinadora de zona"
              valor={
                coordZona
                  ? `${coordZona.nombre} ${coordZona.apellidoPaterno}`
                  : "Sin asignar"
              }
            />
          </div>
          {centro.observaciones && (
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              {centro.observaciones}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clases asignadas */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Clases asignadas
            </h2>
            {puedeEditar && centro.clasesCentro.length > 0 && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/centros/${centro.id}/clases/nueva`}>
                  <Plus className="size-4" />
                  Asignar clase
                </Link>
              </Button>
            )}
          </div>

          {centro.clasesCentro.length === 0 ? (
            <EmptyState
              icono={GraduationCap}
              titulo="Este centro no tiene clases asignadas"
              descripcion="Asigna una clase del catálogo, con su profesor y horarios."
              accion={
                puedeEditar ? (
                  <Button asChild className="bg-agua hover:bg-agua-600">
                    <Link href={`/centros/${centro.id}/clases/nueva`}>
                      <Plus className="size-4" />
                      Asignar clase
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ClasesCentroTabla
              clases={centro.clasesCentro}
              centroId={centro.id}
              puedeEditar={puedeEditar}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
