import type { Metadata } from "next"

import { EVENTO_INFORME } from "@/lib/eventos/informe"
import { obtenerAcomodoInforme } from "@/lib/data/informe-acomodo"
import { StaffAcomodo } from "@/components/eventos/staff-acomodo"

export const metadata: Metadata = {
  title: `Staff · Acomodo — ${EVENTO_INFORME.nombre}`,
  description: "Ubicación de invitados por bloque para el staff del evento.",
  // Página pública con nombres de invitados: fuera de los buscadores.
  robots: { index: false, follow: false },
}

// Se lee en cada visita (los datos vienen de caché de 30 s), para que las
// correcciones del día del evento se vean sin volver a publicar.
export const dynamic = "force-dynamic"

// Página PÚBLICA (sin login) para el staff: se comparte por WhatsApp.
export default async function StaffAcomodoPage() {
  const { bloques, invitados } = await obtenerAcomodoInforme()

  return (
    <StaffAcomodo
      bloques={bloques}
      invitados={invitados}
      titulo={`${EVENTO_INFORME.nombre} · Staff`}
      subtitulo={`Acomodo del evento · ${EVENTO_INFORME.institucion}`}
    />
  )
}
