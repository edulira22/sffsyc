import { quienStem } from "@/lib/stem/acceso"
import { listarCursos } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { HorarioSemanal } from "@/components/stem/horario-semanal"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Horario · Centro STEM" }

export default async function HorarioStemPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const hoy = hoyChihuahua()
  const cursos = (await listarCursos(hoy)).filter((c) => c.estado === "en_curso" || c.estado === "por_iniciar")
  return (
    <div>
      <PageHeader titulo="Horario" descripcion="La semana del Centro STEM: qué clase hay cada día, a qué hora, con quién y cuántos niños." />
      <HorarioSemanal cursos={cursos} hoy={hoy} />
    </div>
  )
}
