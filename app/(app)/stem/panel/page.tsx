import Link from "@/components/ui/enlace"
import { CalendarPlus, UserPlus } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { panelStem } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { PanelStem } from "@/components/stem/panel-stem"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Centro STEM" }

export default async function PanelStemPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const panel = await panelStem(hoyChihuahua())
  return (
    <div>
      <PageHeader
        titulo="Centro STEM"
        descripcion="Cursos, alumnos y asistencia del Centro STEM San Quintín."
        acciones={
          <>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/stem/alumnos/nuevo">
                <UserPlus className="size-4" /> Inscribir alumno
              </Link>
            </Button>
            <Button asChild className="gap-2 bg-agua hover:bg-agua-600">
              <Link href="/stem/cursos/nuevo">
                <CalendarPlus className="size-4" /> Abrir curso
              </Link>
            </Button>
          </>
        }
      />
      <PanelStem panel={panel} />
    </div>
  )
}
