import type { Prisma, EstatusCentro, TipoCentro } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type FiltroCentros = {
  q?: string
  estatus?: EstatusCentro
  tipo?: TipoCentro
  zonaId?: number
  page: number
  pageSize: number
}

export async function listarCentros(filtro: FiltroCentros) {
  const where: Prisma.CentroWhereInput = {}
  if (filtro.zonaId) where.zonaId = filtro.zonaId
  if (filtro.estatus) where.estatus = filtro.estatus
  if (filtro.tipo) where.tipo = filtro.tipo
  if (filtro.q) where.nombre = { contains: filtro.q, mode: "insensitive" }

  const [items, total] = await Promise.all([
    prisma.centro.findMany({
      where,
      include: {
        zona: true,
        coordinadora: true,
        // Solo para contar clases activas en la tarjeta.
        clasesCentro: { where: { estatus: "activa" }, select: { id: true } },
      },
      orderBy: { nombre: "asc" },
      skip: (filtro.page - 1) * filtro.pageSize,
      take: filtro.pageSize,
    }),
    prisma.centro.count({ where }),
  ])

  return {
    items,
    total,
    page: filtro.page,
    totalPages: Math.max(1, Math.ceil(total / filtro.pageSize)),
  }
}

export type CentroTarjeta = Awaited<ReturnType<typeof listarCentros>>["items"][number]

export async function obtenerCentro(id: number) {
  return prisma.centro.findUnique({
    where: { id },
    include: {
      zona: true,
      coordinadora: true,
      clasesCentro: {
        include: {
          clase: { include: { categoria: true } },
          profesor: true,
          horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
          inscripciones: {
            where: { estatus: "activa" },
            select: { beneficiarioId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export type CentroDetalle = NonNullable<Awaited<ReturnType<typeof obtenerCentro>>>

// Coordinadoras con rol "centro" activas, para el selector del formulario.
export function coordinadorasDeCentroActivas() {
  return prisma.coordinadora.findMany({
    where: { rol: "centro", estatus: "activa" },
    orderBy: [{ apellidoPaterno: "asc" }, { nombre: "asc" }],
  })
}

// Coordinadora de zona (se infiere; nunca se captura en la ficha del centro).
export async function coordinadoraDeZona(zonaId: number) {
  return prisma.coordinadora.findFirst({
    where: { rol: "zona", zonaId, estatus: "activa" },
  })
}

// Zonas con su coordinadora de zona ya resuelta (para el formulario de centro).
export async function zonasConCoordinadora() {
  const [zonas, coordsZona] = await Promise.all([
    prisma.zona.findMany({ orderBy: { nombre: "asc" } }),
    prisma.coordinadora.findMany({
      where: { rol: "zona", estatus: "activa", zonaId: { not: null } },
    }),
  ])
  const mapa = new Map<number, string>()
  for (const c of coordsZona) {
    if (c.zonaId != null) {
      mapa.set(c.zonaId, `${c.nombre} ${c.apellidoPaterno}`)
    }
  }
  return zonas.map((z) => ({
    id: z.id,
    nombre: z.nombre,
    coordinadoraZona: mapa.get(z.id) ?? null,
  }))
}

export type ZonaConCoordinadora = Awaited<
  ReturnType<typeof zonasConCoordinadora>
>[number]
