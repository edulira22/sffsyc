import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { alumnosParaBuscar, obtenerCurso, opcionesCurso } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { CursoDetalle } from "@/components/stem/curso-detalle"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Curso · Centro STEM" }

export default async function CursoStemPage({ params }: { params: { id: string } }) {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const hoy = hoyChihuahua()
  const id = Number.parseInt(params.id, 10)
  const curso = Number.isFinite(id) ? await obtenerCurso(id, hoy) : null
  if (!curso) notFound()
  const [opciones, buscables] = await Promise.all([opcionesCurso(), alumnosParaBuscar(hoy)])
  return (
    <div className="space-y-4">
      <Link href="/stem/cursos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Cursos
      </Link>
      <CursoDetalle curso={curso} hoy={hoy} admin opciones={opciones} buscables={buscables} />
    </div>
  )
}
