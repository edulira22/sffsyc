// Solo servidor. Excel de una entrega: una tabla simple, una fila por solicitud,
// sin títulos ni celdas combinadas (se puede convertir en tabla en Excel o Sheets).
// El folio es un enlace al escaneo de esa solicitud.
import ExcelJS from "exceljs"

import type { CampanaDetalle } from "@/lib/data/entregas"
import { CATEGORIAS, ESTADOS_SOLICITUD, label } from "@/lib/entregas/catalogos"
import { enlaceEscaneo } from "@/lib/entregas/enlace"

export async function excelEntrega(c: CampanaDetalle, origen: string): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet(c.prefijo, { views: [{ state: "frozen", ySplit: 1 }] })
  hoja.columns = [
    { header: "Folio", key: "folio", width: 11 },
    { header: "Fecha de solicitud", key: "fecha", width: 14 },
    { header: "Categoría", key: "categoria", width: 20 },
    { header: "Quién solicita", key: "solicitante", width: 30 },
    { header: "Cargo / organización", key: "organizacion", width: 36 },
    { header: "Qué solicita", key: "resumen", width: 50 },
    { header: "Fecha del evento", key: "evento", width: 14 },
    { header: "Contacto", key: "contacto", width: 32 },
    ...c.articulos.flatMap((a) => [
      { header: `${a.nombre} solicitados`, key: `s_${a.clave}`, width: 14 },
      { header: `${a.nombre} autorizados`, key: `a_${a.clave}`, width: 14 },
    ]),
    { header: "Estado", key: "estado", width: 13 },
    { header: "¿Se contactó?", key: "contacto_ok", width: 12 },
    { header: "¿Se entregó?", key: "entregado", width: 12 },
    { header: "Fecha de entrega", key: "fechaEntrega", width: 14 },
    { header: "Recogió", key: "recibio", width: 26 },
    { header: "Observaciones", key: "observaciones", width: 40 },
  ]
  hoja.getRow(1).font = { bold: true }

  for (const s of c.solicitudes) {
    const fila: Record<string, unknown> = {
      folio: s.tieneArchivo ? { text: s.folio, hyperlink: enlaceEscaneo(origen, s.id) } : s.folio,
      fecha: s.fechaSolicitud ?? "",
      categoria: label(CATEGORIAS, s.categoria),
      solicitante: s.solicitante,
      organizacion: [s.cargo, s.organizacion].filter(Boolean).join(", "),
      resumen: s.resumen,
      evento: s.fechaEvento ?? "",
      contacto: s.contacto,
      estado: label(ESTADOS_SOLICITUD, s.estado),
      contacto_ok: s.estado === "contactada" || s.estado === "entregada" ? "Sí" : "No",
      entregado: s.estado === "entregada" ? "Sí" : "No",
      fechaEntrega: s.fechaEntrega ?? "",
      recibio: s.recibio,
      observaciones: s.observaciones,
    }
    for (const a of c.articulos) {
      fila[`s_${a.clave}`] = s.cantidades[a.clave]?.solicitado ?? null
      fila[`a_${a.clave}`] = s.cantidades[a.clave]?.autorizado ?? null
    }
    const r = hoja.addRow(fila)
    if (s.tieneArchivo) r.getCell("folio").font = { color: { argb: "FF0563C1" }, underline: true }
  }

  return (await libro.xlsx.writeBuffer()) as ArrayBuffer
}
