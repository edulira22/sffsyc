import { prisma } from "@/lib/prisma"

// Nunca se selecciona el passwordHash hacia la UI.
export async function listarUsuarios() {
  return prisma.usuarioSistema.findMany({
    // Los profesores del Centro STEM se administran en Centro STEM → Profesores.
    where: { rol: { not: "profesor_stem" } },
    select: {
      id: true,
      nombre: true,
      email: true,
      estatus: true,
      createdAt: true,
      areasPermitidas: true,
      areasOficios: true,
      esAdminSistema: true,
    },
    orderBy: { nombre: "asc" },
  })
}

export type UsuarioListado = Awaited<ReturnType<typeof listarUsuarios>>[number]
