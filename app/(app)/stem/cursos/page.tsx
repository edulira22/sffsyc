import Link from "next/link"
import { CalendarPlus } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { listarCursos } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { CursosLista } from "@/components/stem/cursos-lista"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Cursos · Centro STEM" }

export default async function CursosStemPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const cursos = await listarCursos(hoyChihuahua())
  return (
    <div>
      <PageHeader
        titulo="Cursos"
        descripcion="Cada curso es una clase con fechas, días, horario, profesor y cupo."
        acciones={
          <Button asChild className="gap-2 bg-agua hover:bg-agua-600">
            <Link href="/stem/cursos/nuevo">
              <CalendarPlus className="size-4" /> Abrir curso
            </Link>
          </Button>
        }
      />
      <CursosLista cursos={cursos} />
    </div>
  )
}
