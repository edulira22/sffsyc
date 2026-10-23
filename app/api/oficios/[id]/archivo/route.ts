import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Sirve el escaneo de un oficio. /api no pasa por el middleware: la sesión se
// verifica aquí. Los oficios contienen datos personales; nunca se cachean en
// servidores intermedios.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return new Response("No autorizado", { status: 401 })

  const id = Number.parseInt(params.id, 10)
  if (!Number.isFinite(id)) return new Response("Solicitud inválida", { status: 400 })

  const archivo = await prisma.oficioArchivo.findFirst({
    where: { oficioId: id, oficio: { estatus: "activo" } },
  })
  if (!archivo) return new Response("No encontrado", { status: 404 })

  const descargar = new URL(req.url).searchParams.get("descargar") === "1"
  const nombre = archivo.nombreOriginal.replace(/[^\w.\- ]+/g, "_")

  return new Response(new Uint8Array(archivo.contenido), {
    headers: {
      "Content-Type": archivo.tipo,
      "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
