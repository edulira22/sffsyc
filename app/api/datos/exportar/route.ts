import type { NextRequest } from "next/server"

import { auth } from "@/auth"
import { ENTIDADES_EXCEL } from "@/lib/excel/columnas"
import { construirLibro, construirPlantilla } from "@/lib/excel/exportar"
import { obtenerFilasExport } from "@/lib/excel/datos-export"

const TIPO_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export async function GET(req: NextRequest) {
  // /api no pasa por el middleware: verificamos sesión y rol aquí.
  const session = await auth()
  if (!session?.user) {
    return new Response("No autorizado", { status: 401 })
  }
  if (session.user.rol !== "admin" && session.user.rol !== "coordinacion_general") {
    return new Response("Acceso restringido", { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const entidad = searchParams.get("entidad") ?? ""
  const esPlantilla = searchParams.get("plantilla") === "1"

  if (!ENTIDADES_EXCEL[entidad]) {
    return new Response("Entidad no válida", { status: 400 })
  }

  const buffer = esPlantilla
    ? await construirPlantilla(entidad)
    : await construirLibro(entidad, await obtenerFilasExport(entidad))

  const fecha = new Date().toISOString().slice(0, 10)
  const nombreArchivo = esPlantilla
    ? `plantilla-${entidad}.xlsx`
    : `${entidad}-${fecha}.xlsx`

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": TIPO_XLSX,
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store",
    },
  })
}
