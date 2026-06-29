import { prisma } from "@/lib/prisma"

// Consultas de solo lectura del módulo Clases y Staff del verano.

export async function listarPersonalVerano() {
  return prisma.personalVerano.findMany({
    where: { estatus: "activo" },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  })
}

export type PersonalVeranoListado = Awaited<
  ReturnType<typeof listarPersonalVerano>
>[number]

export async function listarClasesVerano() {
  return prisma.claseVerano.findMany({
    where: { estatus: "activa" },
    orderBy: { nombre: "asc" },
    include: { maestro: { select: { id: true, nombre: true } } },
  })
}

export type ClaseVeranoListado = Awaited<
  ReturnType<typeof listarClasesVerano>
>[number]

/** Maestros activos (para asignar a una clase). */
export async function listarMaestrosVerano() {
  return prisma.personalVerano.findMany({
    where: { estatus: "activo", tipo: "maestro" },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  })
}

export async function listarHorarioVerano() {
  return prisma.horarioVerano.findMany({
    orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
    include: {
      clase: {
        select: {
          id: true,
          nombre: true,
          color: true,
          maestro: { select: { nombre: true } },
        },
      },
    },
  })
}

export type HorarioVeranoListado = Awaited<
  ReturnType<typeof listarHorarioVerano>
>[number]
