// Solo servidor. Excel de un reporte del Centro STEM:
//  - Hoja "Reporte": una tabla simple (una fila de encabezados y una por registro),
//    sin títulos ni celdas combinadas, lista para filtrar o convertir en tabla.
//  - Hoja "Resumen": qué reporte es, el periodo, los filtros y sus cifras.
import ExcelJS from "exceljs"

import type { Reporte } from "@/lib/stem/reportes"

export async function excelReporte(r: Reporte, generado: string): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook()

  const hoja = libro.addWorksheet("Reporte", { views: [{ state: "frozen", ySplit: 1 }] })
  hoja.columns = r.columnas.map((c) => ({
    header: c.titulo,
    key: c.clave,
    width: c.ancho ?? (c.tipo === "fecha" ? 12 : c.tipo ? 13 : 20),
  }))
  for (const f of r.filas) {
    const fila: Record<string, unknown> = {}
    for (const c of r.columnas) {
      const v = f[c.clave]
      if (v == null || v === "") fila[c.clave] = null
      else if (c.tipo === "fecha" && typeof v === "string") fila[c.clave] = new Date(`${v}T00:00:00Z`)
      else if (c.tipo === "porcentaje" && typeof v === "number") fila[c.clave] = v / 100
      else fila[c.clave] = v
    }
    hoja.addRow(fila)
  }
  r.columnas.forEach((c, i) => {
    const col = hoja.getColumn(i + 1)
    if (c.tipo === "fecha") col.numFmt = "dd/mm/yyyy"
    if (c.tipo === "porcentaje") col.numFmt = "0%"
  })
  hoja.getRow(1).font = { bold: true }
  // Texto ajustado dentro de su celda: si se desborda sobre la vecina vacía, al
  // copiarlo a Google Sheets llega como celda combinada.
  hoja.eachRow({ includeEmpty: true }, (fila) => {
    for (let i = 1; i <= r.columnas.length; i++) fila.getCell(i).alignment = { wrapText: true, vertical: "top" }
  })

  const resumen = libro.addWorksheet("Resumen")
  resumen.columns = [
    { header: "Concepto", key: "concepto", width: 36 },
    { header: "Valor", key: "valor", width: 40 },
  ]
  resumen.addRow({ concepto: "Reporte", valor: r.titulo })
  resumen.addRow({ concepto: "Periodo", valor: r.periodo })
  resumen.addRow({ concepto: "Filtros", valor: r.filtros })
  resumen.addRow({ concepto: "Generado", valor: generado })
  resumen.addRow({ concepto: "Registros en la hoja Reporte", valor: r.filas.length })
  for (const m of r.metricas) resumen.addRow({ concepto: m.etiqueta, valor: m.nota ? `${m.valor} (${m.nota})` : m.valor })
  resumen.getRow(1).font = { bold: true }
  resumen.eachRow({ includeEmpty: true }, (fila) => {
    for (let i = 1; i <= 2; i++) fila.getCell(i).alignment = { wrapText: true, vertical: "top", horizontal: "left" }
  })

  return (await libro.xlsx.writeBuffer()) as ArrayBuffer
}
