import { prisma } from "@/lib/prisma"

// Consultas de solo lectura para los expedientes de Verano DIFertido.

export type AutorizadoVerano = {
  nombre: string
  celular: string
  parentesco: string
}

/** Lista de inscritos (activos y bajas) para el tablero del evento. */
export async function listarInscripcionesVerano() {
  return prisma.inscripcionVerano.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      fechaNacimiento: true,
      grupo: true,
      talla: true,
      celularWhatsapp: true,
      documentos: true,
      reciboPago: true,
      estatus: true,
      motivoBaja: true,
      createdAt: true,
    },
  })
}

export type InscripcionVeranoListado = Awaited<
  ReturnType<typeof listarInscripcionesVerano>
>[number]

/** Expediente completo de un NNA para ver/imprimir. */
export async function obtenerInscripcionVerano(id: number) {
  return prisma.inscripcionVerano.findUnique({ where: { id } })
}

/** Conteo de inscritos activos (métrica del tablero). */
export async function contarInscripcionesVerano() {
  return prisma.inscripcionVerano.count({ where: { estatus: "activa" } })
}
