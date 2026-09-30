import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/prisma"
import type { BloqueAcomodo, InvitadoAcomodo } from "@/lib/eventos/informe-acomodo"

// Consultas de solo lectura del acomodo del 5º Informe.

/** Etiqueta de caché: las acciones del panel la invalidan al editar. */
export const TAG_ACOMODO = "informe-acomodo"

async function leerAcomodo(): Promise<{
  bloques: BloqueAcomodo[]
  invitados: InvitadoAcomodo[]
}> {
  const [bloques, invitados] = await Promise.all([
    prisma.informeBloque.findMany({ orderBy: { orden: "asc" } }),
    prisma.informeInvitado.findMany({
      where: { estatus: "activo" },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        titulo: true,
        cargo: true,
        grupo: true,
        bloques: true,
        asistencia: true,
        nota: true,
        tejedora: true,
      },
    }),
  ])

  return {
    bloques: bloques.map((b) => ({
      id: b.id,
      lugares: b.lugares,
      grupos: b.grupos,
      nota: b.nota,
      d: b.d,
      x: b.x,
      y: b.y,
      filas: (b.filas as unknown as string[]) ?? [],
    })),
    invitados,
  }
}

/**
 * Acomodo completo (plano + invitados activos). La página pública la abre
 * todo el staff a la vez el día del evento, así que se sirve desde caché y
 * se refresca cada 30 s; las ediciones del panel la invalidan al instante.
 */
export const obtenerAcomodoInforme = unstable_cache(leerAcomodo, [TAG_ACOMODO], {
  revalidate: 30,
  tags: [TAG_ACOMODO],
})

/** Sin caché: para el panel de administración, que debe ver lo último. */
export const obtenerAcomodoInformeSinCache = leerAcomodo
