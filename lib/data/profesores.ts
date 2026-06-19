import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { FiltroCatalogo } from "@/lib/data/filtros"

export async function listarProfesores(filtro: FiltroCatalogo) {
  const where: Prisma.ProfesorWhereInput = {}

  if (filtro.estatus) where.estatus = filtro.estatus

  if (filtro.q) {
    where.OR = [
      { nombre: { contains: filtro.q, mode: "insensitive" } },
      { apellidoPaterno: { contains: filtro.q, mode: "insensitive" } },
      { apellidoMaterno: { contains: filtro.q, mode: "insensitive" } },
      { especialidad: { contains: filtro.q, mode: "insensitive" } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.profesor.findMany({
      where,
      orderBy: [{ apellidoPaterno: "asc" }, { nombre: "asc" }],
      skip: (filtro.page - 1) * filtro.pageSize,
      take: filtro.pageSize,
    }),
    prisma.profesor.count({ where }),
  ])

  return {
    items,
    total,
    page: filtro.page,
    totalPages: Math.max(1, Math.ceil(total / filtro.pageSize)),
  }
}

export type ProfesorListado = Awaited<
  ReturnType<typeof listarProfesores>
>["items"][number]
