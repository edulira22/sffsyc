import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { obtenerInscripcionVerano } from "@/lib/data/verano"
import { ExpedienteVerano } from "@/components/eventos/expediente-verano"
import { BotonImprimir } from "@/components/eventos/boton-imprimir"
import { StatusDocumentos } from "@/components/eventos/status-documentos"

export const metadata = { title: "Expediente — Verano DIFertido" }

export default async function ExpedienteVeranoPage({
  params,
}: {
  params: { id: string }
}) {
  await requerirSesion()

  const id = Number(params.id)
  if (Number.isNaN(id)) notFound()

  const insc = await obtenerInscripcionVerano(id)
  if (!insc) notFound()

  return (
    <div className="space-y-4">
      {/* Barra de acciones — no se imprime */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/eventos/verano-difertido/inscripciones"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Inscripciones
        </Link>
        <BotonImprimir />
      </div>

      {/* Status de documentos (editable, no se imprime) */}
      <StatusDocumentos
        id={insc.id}
        inicial={(insc.documentos as unknown as string[]) ?? []}
      />

      {/* Documento del expediente */}
      <div className="rounded-xl border bg-white shadow-sm print:border-0 print:shadow-none">
        <ExpedienteVerano insc={insc} />
      </div>
    </div>
  )
}
