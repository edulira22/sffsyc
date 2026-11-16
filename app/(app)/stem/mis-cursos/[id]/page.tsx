import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { puedeVerCurso, quienStem } from "@/lib/stem/acceso"
import { obtenerCurso } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { CursoDetalle } from "@/components/stem/curso-detalle"

export const metadata = { title: "Mi curso" }

export default async function MiCursoPage({ params }: { params: { id: string } }) {
  const q = await quienStem()
  const id = Number.parseInt(params.id, 10)
  // Un curso que no es suyo se trata como inexistente.
  if (!Number.isFinite(id) || !q.profesorId || !(await puedeVerCurso(q, id))) notFound()
  const hoy = hoyChihuahua()
  const curso = await obtenerCurso(id, hoy)
  if (!curso) notFound()
  return (
    <div className="space-y-4">
      <Link href="/stem/mis-cursos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Mis cursos
      </Link>
      <CursoDetalle curso={curso} hoy={hoy} admin={false} />
    </div>
  )
}
