import { prisma } from "@/lib/prisma"
import {
  aISO,
  cuentaContraInventario,
  folioSolicitud,
  leerArticulos,
  leerCantidades,
  type Articulo,
  type Cantidades,
} from "@/lib/entregas/catalogos"

// Consultas de solo lectura de Entregas. Nunca cargan los bytes del escaneo
// (se sirven aparte por /api/entregas/[id]/archivo).

export type AvanceArticulo = Articulo & {
  solicitado: number
  autorizado: number
  entregado: number
  /** disponible − autorizado (null si no se capturó inventario). */
  restante: number | null
}

/** Totales por artículo de un conjunto de solicitudes. */
function avance(articulos: Articulo[], solicitudes: { estado: string; cantidades: Cantidades }[]): AvanceArticulo[] {
  return articulos.map((a) => {
    let solicitado = 0
    let autorizado = 0
    let entregado = 0
    for (const s of solicitudes) {
      const c = s.cantidades[a.clave]
      if (!c) continue
      if (s.estado !== "no_procede") solicitado += c.solicitado ?? 0
      if (cuentaContraInventario(s.estado)) autorizado += c.autorizado ?? 0
      if (s.estado === "entregada") entregado += c.autorizado ?? 0
    }
    return { ...a, solicitado, autorizado, entregado, restante: a.disponible == null ? null : a.disponible - autorizado }
  })
}

export async function listarCampanas() {
  const cs = await prisma.entregaCampana.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
    include: { solicitudes: { where: { estatus: "activa" }, select: { estado: true, cantidades: true } } },
  })
  return cs.map((c) => {
    const solicitudes = c.solicitudes.map((s) => ({ estado: s.estado, cantidades: leerCantidades(s.cantidades) }))
    return {
      id: c.id,
      nombre: c.nombre,
      anio: c.anio,
      prefijo: c.prefijo,
      descripcion: c.descripcion,
      estatus: c.estatus,
      articulos: avance(leerArticulos(c.articulos), solicitudes),
      total: solicitudes.length,
      pendientes: solicitudes.filter((s) => ["recibida", "autorizada", "contactada"].includes(s.estado)).length,
      entregadas: solicitudes.filter((s) => s.estado === "entregada").length,
    }
  })
}
export type CampanaListada = Awaited<ReturnType<typeof listarCampanas>>[number]

export async function obtenerCampana(id: number) {
  const c = await prisma.entregaCampana.findUnique({
    where: { id },
    include: {
      solicitudes: {
        where: { estatus: "activa" },
        orderBy: { consecutivo: "asc" },
        select: {
          id: true,
          consecutivo: true,
          fechaSolicitud: true,
          fechaEvento: true,
          categoria: true,
          solicitante: true,
          cargo: true,
          organizacion: true,
          resumen: true,
          contacto: true,
          cantidades: true,
          estado: true,
          fechaEntrega: true,
          recibio: true,
          observaciones: true,
          revisado: true,
          iaEstado: true,
          archivo: { select: { tipo: true } },
        },
      },
    },
  })
  if (!c) return null
  const articulos = leerArticulos(c.articulos)
  const solicitudes = c.solicitudes.map(({ archivo, ...s }) => ({
    ...s,
    folio: folioSolicitud(c.prefijo, s.consecutivo),
    fechaSolicitud: aISO(s.fechaSolicitud),
    fechaEvento: aISO(s.fechaEvento),
    fechaEntrega: aISO(s.fechaEntrega),
    cantidades: leerCantidades(s.cantidades),
    tieneArchivo: archivo !== null,
  }))
  return {
    id: c.id,
    nombre: c.nombre,
    anio: c.anio,
    prefijo: c.prefijo,
    descripcion: c.descripcion,
    estatus: c.estatus,
    articulos,
    avance: avance(articulos, solicitudes),
    solicitudes,
  }
}
export type CampanaDetalle = NonNullable<Awaited<ReturnType<typeof obtenerCampana>>>
export type SolicitudListada = CampanaDetalle["solicitudes"][number]

export async function obtenerSolicitud(id: number) {
  const s = await prisma.entregaSolicitud.findFirst({
    where: { id, estatus: "activa" },
    include: {
      campana: true,
      archivo: { select: { tipo: true, nombreOriginal: true, tamano: true } },
      movimientos: { orderBy: { createdAt: "desc" } },
      lecturas: { select: { id: true } },
    },
  })
  if (!s) return null
  const articulos = leerArticulos(s.campana.articulos)
  return {
    id: s.id,
    folio: folioSolicitud(s.campana.prefijo, s.consecutivo),
    campana: { id: s.campana.id, nombre: s.campana.nombre, estatus: s.campana.estatus },
    articulos,
    estado: s.estado,
    revisado: s.revisado,
    iaEstado: s.iaEstado,
    iaCamposDudosos: s.iaCamposDudosos,
    iaObservacion: s.iaObservacion,
    lecturas: s.lecturas.length,
    creadoPor: s.creadoPor,
    fechaEntrega: aISO(s.fechaEntrega),
    recibio: s.recibio,
    archivo: s.archivo,
    formulario: aFormulario(s, articulos),
    movimientos: s.movimientos.map((m) => ({ id: m.id, tipo: m.tipo, descripcion: m.descripcion, usuario: m.usuarioNombre, fecha: m.createdAt.toISOString() })),
  }
}
export type SolicitudDetalle = NonNullable<Awaited<ReturnType<typeof obtenerSolicitud>>>

/** Valores del formulario de una solicitud (cantidades como texto para los inputs). */
export function aFormulario(
  s: {
    fechaSolicitud: Date | null
    fechaEvento: Date | null
    categoria: string
    solicitante: string
    cargo: string
    organizacion: string
    resumen: string
    contacto: string
    cantidades: unknown
    observaciones: string
  },
  articulos: Articulo[]
) {
  const c = leerCantidades(s.cantidades)
  return {
    fechaSolicitud: aISO(s.fechaSolicitud) ?? "",
    fechaEvento: aISO(s.fechaEvento) ?? "",
    categoria: s.categoria,
    solicitante: s.solicitante,
    cargo: s.cargo,
    organizacion: s.organizacion,
    resumen: s.resumen,
    contacto: s.contacto,
    observaciones: s.observaciones,
    solicitado: Object.fromEntries(articulos.map((a) => [a.clave, c[a.clave]?.solicitado?.toString() ?? ""])),
    autorizado: Object.fromEntries(articulos.map((a) => [a.clave, c[a.clave]?.autorizado?.toString() ?? ""])),
  }
}
export type SolicitudFormulario = ReturnType<typeof aFormulario>
