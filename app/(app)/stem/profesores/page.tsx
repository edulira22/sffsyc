import { quienStem } from "@/lib/stem/acceso"
import { listarClases, listarProfesores } from "@/lib/data/stem"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { ProfesoresStem } from "@/components/stem/profesores-stem"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Profesores · Centro STEM" }

export default async function ProfesoresStemPage() {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const [profesores, clases] = await Promise.all([listarProfesores(hoyChihuahua()), listarClases()])
  return (
    <div>
      <PageHeader titulo="Profesores" descripcion="Su perfil, las clases que pueden impartir y su acceso a la plataforma." />
      <ProfesoresStem profesores={profesores} clases={clases.filter((c) => c.estatus === "activa").map((c) => ({ id: c.id, nombre: c.nombre }))} />
    </div>
  )
}
