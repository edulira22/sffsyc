import { prisma } from "@/lib/prisma"
import {
  aISO,
  ESTADOS_PENDIENTES,
  esPendiente,
  folioOficio,
  hoyChihuahua,
  semaforo,
} from "@/lib/oficios/catalogos"
import { energiaLirabot } from "@/lib/oficios/ia"
import type { OficioInput } from "@/lib/schemas/oficio"

// Consultas de solo lectura del módulo Oficios. Nunca cargan los bytes del
// escaneo (se sirven aparte por /api/oficios/[id]/archivo).

const CAMPOS_LISTA = {
  id: true,
  anio: true,
  consecutivo: true,
  numeroOficio: true,
  numeroRecepcion: true,
  idBitacora: true,
  fechaRecepcion: true,
  remitente: true,
  dependencia: true,
  tipo: true,
  asunto: true,
  resumen: true,
  areaResponsable: true,
  prioridad: true,
  estado: true,
  requiereRespuesta: true,
  fechaLimite: true,
  revisado: true,
  iaEstado: true,
  archivo: { select: { tipo: true } },
} as const

export async function listarOficios(anio?: number) {
  const filas = await prisma.oficio.findMany({
    where: { estatus: "activo", ...(anio ? { anio } : {}) },
    orderBy: [{ anio: "desc" }, { consecutivo: "desc" }],
    select: CAMPOS_LISTA,
  })
  return filas.map(({ archivo, ...o }) => ({
    ...o,
    tieneArchivo: archivo !== null,
    archivoTipo: archivo?.tipo ?? null,
    folio: folioOficio(o.anio, o.consecutivo),
    fechaRecepcion: aISO(o.fechaRecepcion)!,
    fechaLimite: aISO(o.fechaLimite),
  }))
}

export type OficioListado = Awaited<ReturnType<typeof listarOficios>>[number]

export async function aniosConOficios(): Promise<number[]> {
  const r = await prisma.oficio.groupBy({ by: ["anio"], where: { estatus: "activo" }, orderBy: { anio: "desc" } })
  return r.map((x) => x.anio)
}

export async function resumenOficios() {
  const hoy = hoyChihuahua()
  const inicioMes = new Date(`${hoy.slice(0, 7)}-01T00:00:00Z`)
  const [abiertos, recibidosMes, espacio, energia] = await Promise.all([
    prisma.oficio.findMany({
      where: { estatus: "activo", estado: { in: ESTADOS_PENDIENTES } },
      select: { estado: true, fechaLimite: true, revisado: true },
    }),
    prisma.oficio.count({ where: { estatus: "activo", fechaRecepcion: { gte: inicioMes } } }),
    prisma.oficioArchivo.aggregate({ _sum: { tamano: true } }),
    energiaLirabot(),
  ])
  const semaforos = abiertos.map((o) => semaforo(o.estado, aISO(o.fechaLimite), hoy))
  const sinRevisar = await prisma.oficio.count({ where: { estatus: "activo", revisado: false } })
  return {
    pendientes: abiertos.length,
    vencidos: semaforos.filter((s) => s === "vencido").length,
    porVencer: semaforos.filter((s) => s === "por_vencer").length,
    sinRevisar,
    recibidosMes,
    espacioMB: Math.round(((espacio._sum.tamano ?? 0) / 1024 / 1024) * 10) / 10,
    energia,
  }
}

export type ResumenOficios = Awaited<ReturnType<typeof resumenOficios>>

/** Valores del formulario a partir de un oficio guardado. */
export function aFormulario(o: {
  numeroOficio: string
  numeroRecepcion: string
  fechaDocumento: Date | null
  fechaRecepcion: Date
  remitente: string
  cargoRemitente: string
  dependencia: string
  dirigidoA: string
  tipo: string
  asunto: string
  resumen: string
  areaResponsable: string
  prioridad: string
  requiereRespuesta: boolean
  fechaLimite: Date | null
  respuestaNumero: string
  respuestaFecha: Date | null
}): OficioInput {
  return {
    numeroOficio: o.numeroOficio,
    numeroRecepcion: o.numeroRecepcion,
    fechaDocumento: aISO(o.fechaDocumento) ?? "",
    fechaRecepcion: aISO(o.fechaRecepcion)!,
    remitente: o.remitente,
    cargoRemitente: o.cargoRemitente,
    dependencia: o.dependencia,
    dirigidoA: o.dirigidoA,
    tipo: o.tipo as OficioInput["tipo"],
    asunto: o.asunto,
    resumen: o.resumen,
    areaResponsable: o.areaResponsable as OficioInput["areaResponsable"],
    prioridad: o.prioridad as OficioInput["prioridad"],
    requiereRespuesta: o.requiereRespuesta,
    fechaLimite: aISO(o.fechaLimite) ?? "",
    respuestaNumero: o.respuestaNumero,
    respuestaFecha: aISO(o.respuestaFecha) ?? "",
  }
}

export async function obtenerOficio(id: number) {
  const o = await prisma.oficio.findFirst({
    where: { id, estatus: "activo" },
    include: {
      archivo: { select: { nombreOriginal: true, tipo: true, tamano: true } },
      movimientos: { orderBy: { createdAt: "desc" } },
      lecturas: {
        orderBy: { createdAt: "desc" },
        select: { modelo: true, costoUsd: true, exito: true, error: true, createdAt: true, tokensEntrada: true, tokensSalida: true },
      },
    },
  })
  if (!o) return null
  return {
    id: o.id,
    folio: folioOficio(o.anio, o.consecutivo),
    estado: o.estado,
    revisado: o.revisado,
    iaEstado: o.iaEstado,
    iaCamposDudosos: o.iaCamposDudosos,
    iaObservacion: o.iaObservacion,
    creadoPorNombre: o.creadoPorNombre,
    createdAt: o.createdAt,
    pendiente: esPendiente(o.estado),
    formulario: aFormulario(o),
    archivo: o.archivo,
    movimientos: o.movimientos.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      descripcion: m.descripcion,
      usuarioNombre: m.usuarioNombre,
      fecha: m.createdAt,
    })),
    lecturas: o.lecturas,
  }
}

export type OficioDetalle = NonNullable<Awaited<ReturnType<typeof obtenerOficio>>>
