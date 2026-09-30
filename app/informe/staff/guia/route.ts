import { prisma } from "@/lib/prisma"

// Guía del staff en PDF. Se sirve desde la base de datos y no desde /public
// porque lista a los invitados confirmados y el repositorio es público.
// Ruta PÚBLICA, igual que la página del staff.

export const dynamic = "force-dynamic"

export async function GET() {
  const archivo = await prisma.informeArchivo.findUnique({
    where: { nombre: "guia_staff" },
  })
  if (!archivo) {
    return new Response("La guía del staff aún no está disponible.", {
      status: 404,
    })
  }

  return new Response(new Uint8Array(archivo.contenido), {
    headers: {
      "Content-Type": archivo.tipo,
      "Content-Disposition":
        'attachment; filename="guia-staff-5o-informe-dif-municipal.pdf"',
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
