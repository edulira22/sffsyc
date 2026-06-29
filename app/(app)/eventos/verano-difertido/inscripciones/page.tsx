import Link from "next/link"
import { ArrowLeft, ExternalLink, Users } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { listarInscripcionesVerano } from "@/lib/data/verano"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { InscripcionesTabla } from "@/components/eventos/inscripciones-tabla"

export const metadata = { title: "Inscripciones — Verano DIFertido" }

export default async function InscripcionesVeranoPage() {
  await requerirSesion()

  const inscripciones = await listarInscripcionesVerano()

  return (
    <div className="space-y-4">
      <Link
        href="/eventos/verano-difertido"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Verano DIFertido 2026
      </Link>

      <PageHeader
        titulo="Inscripciones"
        descripcion="Consulta, filtra y administra a los niños inscritos."
        acciones={
          <Button asChild className="gap-2 bg-agua hover:bg-agua-600">
            <a href="/verano" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Abrir formulario público
            </a>
          </Button>
        }
      />

      {inscripciones.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Aún no hay inscripciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las inscripciones capturadas en el formulario público aparecerán aquí.
          </p>
        </div>
      ) : (
        <InscripcionesTabla inscripciones={inscripciones} />
      )}
    </div>
  )
}
