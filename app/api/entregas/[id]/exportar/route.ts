import { auth } from "@/auth"
import { accesoDe } from "@/lib/acceso"
import { obtenerCampana } from "@/lib/data/entregas"
import { excelEntrega } from "@/lib/entregas/excel"

// Excel de una entrega (ver lib/entregas/excel.ts).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return new Response("No autorizado", { status: 401 })
  if (!(await accesoDe(session)).areas.includes("entregas")) return new Response("Acceso restringido", { status: 403 })

  const id = Number.parseInt(params.id, 10)
  const c = Number.isFinite(id) ? await obtenerCampana(id) : null
  if (!c) return new Response("No encontrado", { status: 404 })

  const buffer = await excelEntrega(c, new URL(req.url).origin)
  const nombre = `${c.prefijo}-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
