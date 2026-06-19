import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { FiltroCatalogo } from "@/lib/data/filtros"

export async function listarCoordinadoras(filtro: FiltroCatalogo) {
  const where: Prisma.CoordinadoraWhereInput = {}

  if (filtro.estatus) where.estatus = filtro.estatus

  if (filtro.q) {
    where.OR = [
      { nombre: { contains: filtro.q, mode: "insensitive" } },
      { apellidoPaterno: { contains: filtro.q, mode: "insensitive" } },
      { apellidoMaterno: { contains: filtro.q, mode: "insensitive" } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.coordinadora.findMany({
      where,
      include: { zona: true },
      orderBy: [{ apellidoPaterno: "asc" }, { nombre: "asc" }],
      skip: (filtro.page - 1) * filtro.pageSize,
      take: filtro.pageSize,
    }),
    prisma.coordinadora.count({ where }),
  ])

  return {
    items,
    total,
    page: filtro.page,
    totalPages: Math.max(1, Math.ceil(total / filtro.pageSize)),
  }
}

export type CoordinadoraConZona = Awaited<
  ReturnType<typeof listarCoordinadoras>
>["items"][number]

export function listarZonas() {
  return prisma.zona.findMany({ orderBy: { nombre: "asc" } })
}
