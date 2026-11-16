import Link from "next/link"
import { UserPlus } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { listarAlumnos } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { AlumnosLista } from "@/components/stem/alumnos-lista"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Alumnos · Centro STEM" }

export default async function AlumnosStemPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const alumnos = await listarAlumnos(hoyChihuahua())
  return (
    <div>
      <PageHeader
        titulo="Alumnos"
        descripcion="Cada alumno se identifica por su CURP y tiene un folio único, aunque se inscriba varias veces."
        acciones={
          <Button asChild className="gap-2 bg-agua hover:bg-agua-600">
            <Link href="/stem/alumnos/nuevo">
              <UserPlus className="size-4" /> Inscribir alumno
            </Link>
          </Button>
        }
      />
      <AlumnosLista alumnos={alumnos} />
    </div>
  )
}
