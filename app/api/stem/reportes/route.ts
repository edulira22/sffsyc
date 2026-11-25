import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { puedeAccederArea } from "@/lib/areas"
import { hoyChihuahua } from "@/lib/stem/catalogos"
import { leerParametros, rangoDe } from "@/lib/stem/reportes"
import { generarReporte } from "@/lib/data/stem-reportes"
import { excelReporte } from "@/lib/stem/reportes-excel"

// Excel de un reporte del Centro STEM, con los mismos parámetros que la página.
// /api no pasa por el middleware: el acceso se revisa aquí, leído de la base.
// Solo administradores del Centro STEM (no profesores): trae datos personales.
export async function GET(req: Request) {
  const session = await auth()
  const id = Number.parseInt(String(session?.user?.id ?? ""), 10)
  if (!Number.isFinite(id)) return new Response("No autorizado", { status: 401 })
  const u = await prisma.usuarioSistema.findUnique({ where: { id }, select: { estatus: true, rol: true, areasPermitidas: true } })
  if (!u || u.estatus !== "activo" || u.rol === "profesor_stem" || !puedeAccederArea(u.areasPermitidas, "centro-stem")) {
    return new Response("Acceso restringido", { status: 403 })
  }

  const hoy = hoyChihuahua()
  const p = leerParametros(new URL(req.url).searchParams, hoy)
  const reporte = await generarReporte(p, hoy)
  const generado = new Date().toLocaleString("es-MX", { timeZone: "America/Chihuahua", dateStyle: "long", timeStyle: "short" })
  const buffer = await excelReporte(reporte, generado)

  const { desde, hasta } = rangoDe(p)
  const periodo = p.periodo === "todo" ? "todo" : desde === hasta ? desde : `${desde}_a_${hasta}`
  const nombre = `STEM - ${reporte.titulo} - ${periodo}.xlsx`.replace(/[^\w.\- áéíóúñÁÉÍÓÚÑ]+/g, "_")
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre.normalize("NFD").replace(/[̀-ͯ]/g, "")}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      "Cache-Control": "private, no-store",
    },
  })
}
