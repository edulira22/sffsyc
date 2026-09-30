import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { obtenerAcomodoInformeSinCache } from "@/lib/data/informe-acomodo"
import { EVENTO_INFORME } from "@/lib/eventos/informe"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { AcomodoEditor } from "@/components/eventos/acomodo-editor"

export const metadata = { title: `Acomodo — ${EVENTO_INFORME.nombre}` }

// Editor del acomodo (solo usuarios internos). Lo que se cambia aquí se ve
// al instante en la página pública del staff.
export default async function AcomodoEditorPage() {
  await requerirSesion()
  const { bloques, invitados } = await obtenerAcomodoInformeSinCache()

  return (
    <div className="space-y-4">
      <Link
        href="/eventos/informe-karina"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {EVENTO_INFORME.nombre}
      </Link>

      <PageHeader
        titulo="Acomodo de invitados"
        descripcion="Confirma asistencias, cambia de bloque o agrega invitados. Los cambios se ven al instante en la página del staff."
        acciones={
          <Button asChild variant="outline" className="gap-2">
            <a href="/informe/staff" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Ver página del staff
            </a>
          </Button>
        }
      />

      <AcomodoEditor
        bloques={bloques.map((b) => ({ id: b.id, lugares: b.lugares, grupos: b.grupos }))}
        invitadosIniciales={invitados}
      />
    </div>
  )
}
