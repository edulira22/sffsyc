import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { obtenerInscripcionVerano } from "@/lib/data/verano"
import { folioVerano } from "@/lib/eventos/verano"
import {
  InscripcionForm,
  type InscripcionFormValues,
} from "@/components/eventos/inscripcion-form"
import type { AutorizadoVerano } from "@/lib/data/verano"

export const metadata = { title: "Editar — Verano DIFertido" }

const iso = (d: Date) => d.toISOString().slice(0, 10)

function autorizadosForm(valor: unknown): InscripcionFormValues["autorizados"] {
  const lista = (valor as AutorizadoVerano[]) ?? []
  return [0, 1, 2].map((i) => ({
    nombre: lista[i]?.nombre ?? "",
    celular: lista[i]?.celular ?? "",
    parentesco: lista[i]?.parentesco ?? "",
  }))
}

export default async function EditarInscripcionVeranoPage({
  params,
}: {
  params: { id: string }
}) {
  await requerirSesion()

  const id = Number(params.id)
  if (Number.isNaN(id)) notFound()

  const insc = await obtenerInscripcionVerano(id)
  if (!insc) notFound()

  const inicial: InscripcionFormValues = {
    talla: insc.talla ?? "",
    nombre: insc.nombre,
    primeraVez: insc.primeraVez,
    grupo: insc.grupo ?? "",
    fechaNacimiento: iso(insc.fechaNacimiento),
    fechaInscripcion: iso(insc.fechaInscripcion),
    curp: insc.curp ?? "",
    padre: insc.padre ?? "",
    celularPadre: insc.celularPadre ?? "",
    madre: insc.madre ?? "",
    celularMadre: insc.celularMadre ?? "",
    telefonoCasa: insc.telefonoCasa ?? "",
    celularWhatsapp: insc.celularWhatsapp ?? "",
    domicilio: insc.domicilio ?? "",
    autorizados: autorizadosForm(insc.autorizados),
    documentos: [],
    enfermedades: insc.enfermedades ?? "",
    impideActividad: insc.impideActividad ?? "",
    medicamentos: insc.medicamentos ?? "",
    alergias: insc.alergias ?? "",
    nombreServicioMedico: insc.nombreServicioMedico ?? "",
    numeroServicioMedico: insc.numeroServicioMedico ?? "",
    nombreMedico: insc.nombreMedico ?? "",
    telefonoMedico: insc.telefonoMedico ?? "",
    aceptaReglamento: true,
    nombreFirma: insc.nombreFirma,
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/eventos/verano-difertido/inscripciones/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Expediente {folioVerano(id)}
      </Link>
      <InscripcionForm modo="editar" id={id} inicial={inicial} />
    </div>
  )
}
