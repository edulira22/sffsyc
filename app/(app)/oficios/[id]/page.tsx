import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { accesoOficios } from "@/lib/oficios/acceso"
import { obtenerOficio } from "@/lib/data/oficios"
import { hoyChihuahua } from "@/lib/oficios/catalogos"
import { iaDisponible } from "@/lib/oficios/ia"
import { DetalleOficio } from "@/components/oficios/detalle-oficio"
import { SinAccesoOficios } from "@/components/oficios/sin-acceso"

export const metadata = { title: "Oficio" }

// "Leer con IA" corre como Server Action desde esta página: hasta 60 s.
export const maxDuration = 60

export default async function OficioPage({ params }: { params: { id: string } }) {
  const acceso = await accesoOficios()
  if (!acceso.entra) return <SinAccesoOficios />
  const id = Number.parseInt(params.id, 10)
  // Un oficio de un área que el usuario no ve se trata como inexistente.
  const oficio = Number.isFinite(id) ? await obtenerOficio(id, acceso.filtro) : null
  if (!oficio) notFound()

  return (
    <div className="space-y-4">
      <Link href="/oficios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Oficios
      </Link>
      {/* La clave cambia con cada movimiento: tras guardar, el formulario se
          reinicia con los datos del servidor. */}
      <DetalleOficio
        key={`${oficio.id}-${oficio.movimientos.length}-${oficio.estado}`}
        oficio={oficio}
        hoy={hoyChihuahua()}
        iaDisponible={iaDisponible()}
      />
    </div>
  )
}
