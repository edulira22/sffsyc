import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { hoyChihuahua } from "@/lib/oficios/catalogos"
import { iaDisponible } from "@/lib/oficios/ia"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { CapturaOficios } from "@/components/oficios/captura-oficios"

export const metadata = { title: "Registrar oficios" }

// La lectura con IA corre como Server Action desde esta página: hasta 60 s.
export const maxDuration = 60

export default async function NuevoOficioPage() {
  await requerirSesion()
  return (
    <div className="space-y-4">
      <Link href="/oficios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Oficios
      </Link>
      <PageHeader
        titulo="Registrar oficios"
        descripcion="Sube los escaneos: cada uno recibe su folio, la IA propone los datos y tú los confirmas."
      />
      <CapturaOficios hoy={hoyChihuahua()} iaDisponible={iaDisponible()} />
    </div>
  )
}
