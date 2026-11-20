import { notFound } from "next/navigation"

import { obtenerCampana } from "@/lib/data/entregas"
import { energiaLirabot } from "@/lib/oficios/ia"
import { CampanaVista } from "@/components/entregas/campana-vista"

export const metadata = { title: "Entrega" }

// Lirabot puede leer solicitudes desde esta página: hasta 60 s por llamada.
export const maxDuration = 60

export default async function CampanaPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  const [campana, energia] = await Promise.all([Number.isFinite(id) ? obtenerCampana(id) : null, energiaLirabot()])
  if (!campana) notFound()
  return <CampanaVista campana={campana} energia={{ disponible: energia.disponible, restantes: energia.restantes }} />
}
