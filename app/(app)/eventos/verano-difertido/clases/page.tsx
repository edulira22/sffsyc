import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import {
  listarPersonalVerano,
  listarClasesVerano,
  listarMaestrosVerano,
  listarHorarioVerano,
} from "@/lib/data/verano-clases"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { ClasesStaff } from "@/components/eventos/clases-staff"

export const metadata = { title: "Clases y staff — Verano DIFertido" }

export default async function ClasesStaffPage() {
  await requerirSesion()

  const [personal, clases, maestros, horario] = await Promise.all([
    listarPersonalVerano(),
    listarClasesVerano(),
    listarMaestrosVerano(),
    listarHorarioVerano(),
  ])

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
        titulo="Clases y staff"
        descripcion="Personal del curso, clases con su maestro y horario por equipo."
      />

      <ClasesStaff
        personal={personal}
        clases={clases}
        maestros={maestros}
        horario={horario}
      />
    </div>
  )
}
