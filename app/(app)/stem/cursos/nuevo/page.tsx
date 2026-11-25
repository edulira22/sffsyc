import Link from "@/components/ui/enlace"
import { ArrowLeft } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { opcionesCurso } from "@/lib/data/stem"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { CursoForm } from "@/components/stem/curso-form"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Abrir curso · Centro STEM" }

export default async function NuevoCursoPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const opciones = await opcionesCurso()
  const falta =
    opciones.clases.length === 0
      ? { texto: "Primero crea al menos una clase.", href: "/stem/clases", enlace: "Ir a Clases" }
      : opciones.profesores.length === 0
        ? { texto: "Primero registra al menos un profesor con las clases que imparte.", href: "/stem/profesores", enlace: "Ir a Profesores" }
        : null
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/stem/cursos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Cursos
      </Link>
      <PageHeader titulo="Abrir curso" descripcion="Elige la clase, quién la da y cuándo." />
      {falta ? (
        <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
          {falta.texto}{" "}
          <Link href={falta.href} className="font-medium text-agua hover:underline">
            {falta.enlace}
          </Link>
        </p>
      ) : (
        <div className="rounded-xl border bg-white p-4 sm:p-6">
          <CursoForm opciones={opciones} />
        </div>
      )}
    </div>
  )
}
