import ExcelJS from "exceljs"

import { auth } from "@/auth"
import { accesoDe } from "@/lib/acceso"
import { obtenerCampana } from "@/lib/data/entregas"
import { CATEGORIAS, ESTADOS_SOLICITUD, label } from "@/lib/entregas/catalogos"

// Excel de una entrega: una fila por solicitud, cantidades por artículo,
// seguimiento y un enlace a la solicitud (con su escaneo) en la plataforma.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return new Response("No autorizado", { status: 401 })
  if (!(await accesoDe(session)).areas.includes("entregas")) return new Response("Acceso restringido", { status: 403 })

  const id = Number.parseInt(params.id, 10)
  const c = Number.isFinite(id) ? await obtenerCampana(id) : null
  if (!c) return new Response("No encontrado", { status: 404 })
  const origen = new URL(req.url).origin

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
    { header: "Solicitud (escaneo)", key: "enlace", width: 20 },
  ]
  hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3A6B" } }
  hoja.getRow(1).alignment = { vertical: "middle", wrapText: true }

  for (const s of c.solicitudes) {
    const fila: Record<string, unknown> = {
      folio: s.folio,
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
      enlace: { text: `Ver ${s.folio}`, hyperlink: `${origen}/entregas/solicitud/${s.id}` },
    }
    for (const a of c.articulos) {
      fila[`s_${a.clave}`] = s.cantidades[a.clave]?.solicitado ?? null
      fila[`a_${a.clave}`] = s.cantidades[a.clave]?.autorizado ?? null
    }
    const r = hoja.addRow(fila)
    r.getCell("enlace").font = { color: { argb: "FF2E8B7A" }, underline: true }
    r.alignment = { vertical: "top", wrapText: true }
  }

  // Totales (lo autorizado solo cuenta si no es "no procede").
  const total: Record<string, unknown> = { contacto: "TOTAL" }
  for (const a of c.avance) {
    total[`s_${a.clave}`] = a.solicitado
    total[`a_${a.clave}`] = a.autorizado
  }
  const filaTotal = hoja.addRow(total)
  filaTotal.font = { bold: true }

  const buffer = await libro.xlsx.writeBuffer()
  const nombre = `${c.prefijo}-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
