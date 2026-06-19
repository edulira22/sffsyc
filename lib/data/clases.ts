import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { FiltroCatalogo } from "@/lib/data/filtros"

export async function listarClases(filtro: FiltroCatalogo) {
  const where: Prisma.CatalogoClaseWhereInput = {}

  if (filtro.estatus) where.estatus = filtro.estatus

  if (filtro.q) {
    where.OR = [
      { nombreOficial: { contains: filtro.q, mode: "insensitive" } },
      { variantesAlias: { contains: filtro.q, mode: "insensitive" } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.catalogoClase.findMany({
      where,
      include: { categoria: true },
      orderBy: { nombreOficial: "asc" },
      skip: (filtro.page - 1) * filtro.pageSize,
      take: filtro.pageSize,
    }),
    prisma.catalogoClase.count({ where }),
  ])

  return {
    items,
    total,
    page: filtro.page,
    totalPages: Math.max(1, Math.ceil(total / filtro.pageSize)),
  }
}

export type ClaseConCategoria = Awaited<
  ReturnType<typeof listarClases>
>["items"][number]

// Categorías activas para el selector del formulario de clases.
export function listarCategoriasActivas() {
  return prisma.catalogoCategoria.findMany({
    where: { estatus: "activa" },
    orderBy: { nombre: "asc" },
  })
}
