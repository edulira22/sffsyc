import { notFound } from "next/navigation"

import { obtenerSolicitud } from "@/lib/data/entregas"
import { SolicitudDetalle } from "@/components/entregas/solicitud-detalle"

export const metadata = { title: "Solicitud de entrega" }

// "Leer con Lirabot" corre desde esta página: hasta 60 s.
export const maxDuration = 60

export default async function SolicitudPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  const s = Number.isFinite(id) ? await obtenerSolicitud(id) : null
  if (!s) notFound()
  // La clave cambia con cada movimiento: tras guardar o leer, el formulario toma los datos nuevos.
  return <SolicitudDetalle key={`${s.id}-${s.movimientos.length}-${s.estado}`} s={s} />
}
