import { quienStem } from "@/lib/stem/acceso"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { aQuery, leerParametros } from "@/lib/stem/reportes"
import { generarReporte, opcionesReporte } from "@/lib/data/stem-reportes"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { FormReporte, VistaReporte } from "@/components/stem/reportes"
import { SinAccesoStem } from "@/components/stem/ui"

export const metadata = { title: "Reportes · Centro STEM" }

export default async function ReportesStemPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = await quienStem()
  if (!q.esAdmin) return <SinAccesoStem />
  const hoy = hoyChihuahua()
  const p = leerParametros(searchParams, hoy)
  const [reporte, opciones] = await Promise.all([generarReporte(p, hoy), opcionesReporte()])

  const actual = Number(hoy.slice(0, 4))
  const primero = Math.min(opciones.primerAnio ?? actual, actual)
  const anios = Array.from({ length: actual - primero + 2 }, (_, i) => String(actual + 1 - i))

  return (
    <div className="space-y-6">
      <PageHeader titulo="Reportes" descripcion="Elige qué quieres ver, de qué periodo y para qué clase o profesor; descárgalo en Excel." />
      <FormReporte key={aQuery(p)} inicial={p} clases={opciones.clases} profesores={opciones.profesores} anios={anios} />
      <VistaReporte reporte={reporte} query={aQuery(p)} />
    </div>
  )
}
