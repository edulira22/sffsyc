import Link from "next/link"
import { CalendarRange } from "lucide-react"

import { quienStem } from "@/lib/stem/acceso"
import { listarCursos } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { CursosLista } from "@/components/stem/cursos-lista"

export const metadata = { title: "Mis cursos" }

export default async function MisCursosPage() {
  const q = await quienStem()
  if (!q.profesorId) {
    return (
      <EmptyState
        icono={CalendarRange}
        titulo="Esta vista es para los profesores del Centro STEM"
        descripcion={q.esAdmin ? "Como administración, encuentras todos los cursos en Centro STEM → Cursos." : "Tu cuenta no tiene un perfil de profesor activo."}
        accion={
          q.esAdmin ? (
            <Link href="/stem/cursos" className="text-sm font-medium text-agua hover:underline">
              Ir a Cursos
            </Link>
          ) : undefined
        }
      />
    )
  }
  const cursos = await listarCursos(hoyChihuahua(), q.profesorId)
  return (
    <div>
      <PageHeader titulo="Mis cursos" descripcion={`Hola, ${q.nombre}. Aquí están tus cursos: entra a uno para tomar asistencia y ver a tus alumnos.`} />
      <CursosLista
        cursos={cursos}
        base="/stem/mis-cursos"
        vacio={<EmptyState icono={CalendarRange} titulo="Aún no tienes cursos asignados" descripcion="Cuando la administración te asigne un curso, aparecerá aquí." />}
      />
    </div>
  )
}
