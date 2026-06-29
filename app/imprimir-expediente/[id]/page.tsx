import { notFound } from "next/navigation"

import { requerirSesion } from "@/lib/session"
import { obtenerInscripcionVerano } from "@/lib/data/verano"
import { folioVerano } from "@/lib/eventos/verano"
import { ExpedienteVerano } from "@/components/eventos/expediente-verano"
import { AutoImprimir } from "@/components/eventos/auto-imprimir"

export const metadata = { title: "Imprimir expediente — Verano DIFertido" }

// Página dedicada para imprimir (se abre en otra pestaña). Fuera del (app)
// shell: sin barra lateral, solo el documento — listo para imprimir.
export default async function ImprimirExpedientePage({
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
    <div className="min-h-screen bg-muted/30 py-6 print:bg-white print:py-0">
      <AutoImprimir folio={folioVerano(id)} />
      <div className="mx-auto max-w-3xl px-2 print:max-w-none print:px-0">
        <ExpedienteVerano insc={insc} />
      </div>
    </div>
  )
}
