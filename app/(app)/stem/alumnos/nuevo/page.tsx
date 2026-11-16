import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { cursosAbiertos } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { AlumnoForm } from "@/components/stem/alumno-form"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Inscribir alumno · Centro STEM" }

export default async function NuevoAlumnoPage({ searchParams }: { searchParams: { curso?: string } }) {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const hoy = hoyChihuahua()
  const cursos = await cursosAbiertos(hoy)
  const cursoInicial = cursos.some((c) => String(c.id) === searchParams.curso) ? searchParams.curso! : ""
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href={cursoInicial ? `/stem/cursos/${cursoInicial}` : "/stem/alumnos"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {cursoInicial ? "Curso" : "Alumnos"}
      </Link>
      <PageHeader titulo="Inscribir alumno" descripcion="Empieza por la CURP: si ya está registrado, te avisamos para no duplicarlo." />
      <AlumnoForm hoy={hoy} cursos={cursos} cursoInicial={cursoInicial} />
    </div>
  )
}
