import Link from "@/components/ui/enlace"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { cursosAbiertos, obtenerAlumno } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { AlumnoDetalle } from "@/components/stem/alumno-detalle"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Alumno · Centro STEM" }

export default async function AlumnoStemPage({ params }: { params: { id: string } }) {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const hoy = hoyChihuahua()
  const id = Number.parseInt(params.id, 10)
  const alumno = Number.isFinite(id) ? await obtenerAlumno(id, hoy) : null
  if (!alumno) notFound()
  const cursos = await cursosAbiertos(hoy)
  return (
    <div className="space-y-4">
      <Link href="/stem/alumnos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Alumnos
      </Link>
      <AlumnoDetalle alumno={alumno} cursos={cursos} hoy={hoy} />
    </div>
  )
}
