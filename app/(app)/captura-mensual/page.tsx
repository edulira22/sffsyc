import { requerirSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { CapturaZonaMensual } from "@/components/centros/captura-zona-mensual"

export const metadata = { title: "Captura mensual" }

export default async function CapturaMensualPage() {
  const session = await requerirSesion()
  const esZona = session.user.rol === "coordinadora_zona"

  const centros = await prisma.centro.findMany({
    where: {
      estatus: "activo",
      ...(esZona && session.user.zonaId ? { zonaId: session.user.zonaId } : {}),
    },
    select: {
      id: true,
      nombre: true,
      zona: { select: { nombre: true } },
    },
    orderBy: [{ zona: { nombre: "asc" } }, { nombre: "asc" }],
  })

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Captura mensual"
        descripcion="Registra la lista de beneficiarios de un centro en el mes correspondiente."
      />
      <CapturaZonaMensual centros={centros} />
    </div>
  )
}
