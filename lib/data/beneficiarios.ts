import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// --- Búsqueda de duplicados (obligatoria antes de registrar) -----------------

export type ParamsDuplicado = {
  curp?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  nombres?: string
  fechaNacimiento?: string // YYYY-MM-DD
}

export async function buscarDuplicados(params: ParamsDuplicado) {
  // 1) Por CURP exacta (la coincidencia más fuerte).
  if (params.curp && params.curp.trim()) {
    const porCurp = await prisma.beneficiario.findMany({
      where: { curp: params.curp.trim().toUpperCase() },
      take: 10,
    })
    if (porCurp.length > 0) return porCurp
  }

  // 2) Por nombre + apellido paterno (+ fecha si se proporcionó).
  if (params.nombres?.trim() && params.apellidoPaterno?.trim()) {
    return prisma.beneficiario.findMany({
      where: {
        apellidoPaterno: { equals: params.apellidoPaterno.trim(), mode: "insensitive" },
        nombres: { contains: params.nombres.trim(), mode: "insensitive" },
        ...(params.fechaNacimiento
          ? { fechaNacimiento: new Date(params.fechaNacimiento) }
          : {}),
      },
      take: 10,
    })
  }

  return []
}

// --- Listado ----------------------------------------------------------------

export type FiltroBeneficiarios = {
  q?: string
  centroId?: number
  claseId?: number
  zonaId?: number // restricción por rol (coordinadora de zona)
  page: number
  pageSize: number
}

export async function listarBeneficiarios(filtro: FiltroBeneficiarios) {
  const where: Prisma.BeneficiarioWhereInput = {}

  if (filtro.q) {
    where.OR = [
      { nombres: { contains: filtro.q, mode: "insensitive" } },
      { apellidoPaterno: { contains: filtro.q, mode: "insensitive" } },
      { apellidoMaterno: { contains: filtro.q, mode: "insensitive" } },
      { curp: { contains: filtro.q.toUpperCase() } },
    ]
  }

  // Filtros que dependen de las inscripciones (centro/clase/zona).
  const claseCentroFiltro: Prisma.ClaseCentroWhereInput = {}
  if (filtro.centroId) claseCentroFiltro.centroId = filtro.centroId
  if (filtro.claseId) claseCentroFiltro.claseId = filtro.claseId
  if (filtro.zonaId) claseCentroFiltro.centro = { zonaId: filtro.zonaId }

  if (Object.keys(claseCentroFiltro).length > 0) {
    where.inscripciones = {
      some: { estatus: "activa", claseCentro: claseCentroFiltro },
    }
  }

  const [items, total] = await Promise.all([
    prisma.beneficiario.findMany({
      where,
      include: {
        inscripciones: {
          where: { estatus: "activa" },
          include: {
            claseCentro: { include: { clase: true, centro: true } },
          },
        },
      },
      orderBy: [{ apellidoPaterno: "asc" }, { nombres: "asc" }],
      skip: (filtro.page - 1) * filtro.pageSize,
      take: filtro.pageSize,
    }),
    prisma.beneficiario.count({ where }),
  ])

  return {
    items,
    total,
    page: filtro.page,
    totalPages: Math.max(1, Math.ceil(total / filtro.pageSize)),
  }
}

export type BeneficiarioListado = Awaited<
  ReturnType<typeof listarBeneficiarios>
>["items"][number]

// --- Ficha ------------------------------------------------------------------

export async function obtenerBeneficiario(id: number) {
  return prisma.beneficiario.findUnique({
    where: { id },
    include: {
      inscripciones: {
        include: {
          claseCentro: {
            include: {
              clase: { include: { categoria: true } },
              centro: true,
              profesor: true,
              horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
            },
          },
        },
        orderBy: { fechaInscripcion: "desc" },
      },
    },
  })
}

export type BeneficiarioDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerBeneficiario>>
>

// --- Apoyo para inscripciones -----------------------------------------------

// Centros con sus clases activas, para el selector de nueva inscripción.
export async function centrosConClasesActivas(zonaId?: number) {
  const centros = await prisma.centro.findMany({
    where: {
      estatus: { not: "inactivo" },
      ...(zonaId ? { zonaId } : {}),
      clasesCentro: { some: { estatus: "activa" } },
    },
    include: {
      clasesCentro: {
        where: { estatus: "activa" },
        include: {
          clase: true,
          horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
        },
      },
    },
    orderBy: { nombre: "asc" },
  })
  return centros
}

export type CentroConClases = Awaited<
  ReturnType<typeof centrosConClasesActivas>
>[number]

// Listas para filtros del listado de beneficiarios.
export async function opcionesFiltroBeneficiarios(zonaId?: number) {
  const [centros, clases] = await Promise.all([
    prisma.centro.findMany({
      where: zonaId ? { zonaId } : {},
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.catalogoClase.findMany({
      where: { estatus: "activa" },
      select: { id: true, nombreOficial: true },
      orderBy: { nombreOficial: "asc" },
    }),
  ])
  return { centros, clases }
}
