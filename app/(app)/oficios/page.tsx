import Link from "next/link"
import { Download, FilePlus2 } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { aniosConOficios, listarOficios, resumenOficios } from "@/lib/data/oficios"
import { hoyChihuahua } from "@/lib/oficios/catalogos"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { BandejaOficios } from "@/components/oficios/bandeja-oficios"

export const metadata = { title: "Oficios" }

export default async function OficiosPage({ searchParams }: { searchParams: { anio?: string } }) {
  await requerirSesion()
  const hoy = hoyChihuahua()
  const anioActual = Number(hoy.slice(0, 4))
  const anio = Number(searchParams.anio) || anioActual

  const [oficios, resumen, anios] = await Promise.all([listarOficios(anio), resumenOficios(), aniosConOficios()])

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Oficios"
        descripcion="Bitácora de oficios recibidos: quién los atiende, en qué estado van y qué plazos corren."
        acciones={
          <div className="flex flex-wrap gap-2">
            {oficios.length > 0 && (
              <Button asChild variant="outline" className="gap-2">
                <a href="/api/datos/exportar?entidad=oficios" download>
                  <Download className="size-4" /> Exportar Excel
                </a>
              </Button>
            )}
            <Button asChild className="gap-2 bg-agua hover:bg-agua-600">
              <Link href="/oficios/nuevo">
                <FilePlus2 className="size-4" /> Registrar oficios
              </Link>
            </Button>
          </div>
        }
      />
      <BandejaOficios
        oficios={oficios}
        resumen={resumen}
        hoy={hoy}
        anios={anios.includes(anioActual) ? anios : [anioActual, ...anios]}
        anio={anio}
      />
    </div>
  )
}
