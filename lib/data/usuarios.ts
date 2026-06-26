import { prisma } from "@/lib/prisma"

// Nunca se selecciona el passwordHash hacia la UI.
export async function listarUsuarios() {
  return prisma.usuarioSistema.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      estatus: true,
      createdAt: true,
    },
    orderBy: { nombre: "asc" },
  })
}

export type UsuarioListado = Awaited<ReturnType<typeof listarUsuarios>>[number]
