import ExcelJS from "exceljs"
import { ENTIDADES_EXCEL, type EntidadExcel } from "@/lib/excel/columnas"

const AZUL_GOBIERNO = "FF1A3A6B"

function configurarHoja(ws: ExcelJS.Worksheet, entidad: EntidadExcel) {
  ws.columns = entidad.columnas.map((c) => ({
    header: c.encabezado,
    key: c.clave,
    width: c.ancho ?? 18,
  }))
  const encabezado = ws.getRow(1)
  encabezado.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
  encabezado.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: AZUL_GOBIERNO },
  }
  encabezado.alignment = { vertical: "middle" }
  encabezado.height = 22
  ws.views = [{ state: "frozen", ySplit: 1 }]
  // Marca visual de columnas obligatorias.
  entidad.columnas.forEach((c, i) => {
    if (c.requerida) {
      ws.getColumn(i + 1).font = undefined
    }
  })
}

function nuevoLibro() {
  const wb = new ExcelJS.Workbook()
  wb.creator = "SFFSyC · DIF Chihuahua"
  wb.created = new Date()
  return wb
}

/** Libro con los datos actuales de la entidad. */
export async function construirLibro(
  entidadId: string,
  filas: Record<string, unknown>[]
): Promise<Buffer> {
  const entidad = ENTIDADES_EXCEL[entidadId]
  const wb = nuevoLibro()
  const ws = wb.addWorksheet(entidad.hoja)
  configurarHoja(ws, entidad)
  for (const fila of filas) ws.addRow(fila)
  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/** Plantilla vacía con encabezados, una fila de ejemplo y una hoja de ayuda. */
export async function construirPlantilla(entidadId: string): Promise<Buffer> {
  const entidad = ENTIDADES_EXCEL[entidadId]
  const wb = nuevoLibro()
  const ws = wb.addWorksheet(entidad.hoja)
  configurarHoja(ws, entidad)

  const ejemplo: Record<string, string> = {}
  for (const c of entidad.columnas) ejemplo[c.clave] = c.ejemplo ?? ""
  const filaEjemplo = ws.addRow(ejemplo)
  filaEjemplo.font = { italic: true, color: { argb: "FF94A3B8" } }

  // Hoja de instrucciones.
  const ayuda = wb.addWorksheet("Instrucciones")
  ayuda.columns = [
    { header: "Columna", key: "col", width: 26 },
    { header: "¿Obligatoria?", key: "req", width: 16 },
    { header: "Indicaciones", key: "nota", width: 70 },
  ]
  const encAyuda = ayuda.getRow(1)
  encAyuda.font = { bold: true, color: { argb: "FFFFFFFF" } }
  encAyuda.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: AZUL_GOBIERNO },
  }
  ayuda.addRow({
    col: "—",
    req: "—",
    nota: `Plantilla de ${entidad.titulo}. La fila gris es un ejemplo: bórrala antes de importar. No cambies los encabezados.`,
  })
  for (const c of entidad.columnas) {
    ayuda.addRow({
      col: c.encabezado,
      req: c.requerida ? "Sí" : "No",
      nota: c.nota ?? "",
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
