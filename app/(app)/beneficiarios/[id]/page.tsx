import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Pencil,
  Cake,
  Phone,
  Home,
  IdCard,
  GraduationCap,
  CalendarDays,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import {
  obtenerBeneficiario,
  centrosConClasesActivas,
} from "@/lib/data/beneficiarios"
import { calcularEdad, formatoFecha, antiguedad } from "@/lib/fechas"
import { ESCOLARIDAD_LABEL } from "@/lib/schemas/beneficiario"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { BeneficiarioInscripciones } from "@/components/beneficiarios/beneficiario-inscripciones"
import { BeneficiarioEstatusMenu } from "@/components/beneficiarios/beneficiario-estatus-menu"

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Cake
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

export default async function BeneficiarioFichaPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requerirSesion()
  const id = Number(params.id)
  if (!Number.isInteger(id)) notFound()

  const beneficiario = await obtenerBeneficiario(id)
  if (!beneficiario) notFound()

  const esZona = session.user.rol === "coordinadora_zona"
  const centros = await centrosConClasesActivas(
    esZona ? session.user.zonaId ?? -1 : undefined
  )

  const edad = calcularEdad(beneficiario.fechaNacimiento)
  const esMenor = edad < 18

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/beneficiarios"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Beneficiarios
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {beneficiario.nombres} {beneficiario.apellidoPaterno}{" "}
            {beneficiario.apellidoMaterno ?? ""}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Cake className="size-3" />
              {edad} años
            </Badge>
            {esMenor && <Badge variant="secondary">Menor de edad</Badge>}
            <StatusBadge estatus={beneficiario.estatus} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BeneficiarioEstatusMenu
            beneficiarioId={beneficiario.id}
            estatus={beneficiario.estatus}
          />
          <Button asChild variant="outline">
            <Link href={`/beneficiarios/${beneficiario.id}/editar`}>
              <Pencil className="size-4" />
              Editar datos
            </Link>
          </Button>
        </div>
      </div>

      {/* Datos personales */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Datos personales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato
              icono={CalendarDays}
              etiqueta="Fecha de nacimiento"
              valor={formatoFecha(beneficiario.fechaNacimiento)}
            />
            <Dato
              icono={IdCard}
              etiqueta="CURP"
              valor={beneficiario.curp || "No registrada"}
            />
            <Dato
              icono={Phone}
              etiqueta="Teléfono"
              valor={beneficiario.telefono || "No registrado"}
            />
            <Dato
              icono={Home}
              etiqueta="Domicilio"
              valor={beneficiario.domicilio || "No registrado"}
            />
            <Dato
              icono={GraduationCap}
              etiqueta="Escolaridad"
              valor={
                beneficiario.escolaridad
                  ? ESCOLARIDAD_LABEL[beneficiario.escolaridad]
                  : "No registrada"
              }
            />
            <Dato
              icono={CalendarDays}
              etiqueta="Antigüedad"
              valor={antiguedad(beneficiario.fechaPrimerIngreso)}
            />
            {beneficiario.gradoEscolar && (
              <Dato
                icono={GraduationCap}
                etiqueta="Grado escolar"
                valor={beneficiario.gradoEscolar}
              />
            )}
            {beneficiario.nombreEscuela && (
              <Dato
                icono={GraduationCap}
                etiqueta="Escuela"
                valor={beneficiario.nombreEscuela}
              />
            )}
          </div>
          {beneficiario.observaciones && (
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              {beneficiario.observaciones}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inscripciones */}
      <BeneficiarioInscripciones
        beneficiarioId={beneficiario.id}
        inscripciones={beneficiario.inscripciones}
        centros={centros}
        puedeEditar
      />
    </div>
  )
}
