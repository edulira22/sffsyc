"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { requerirArea } from "@/lib/acceso"
import { prisma } from "@/lib/prisma"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import {
  CATEGORIAS,
  ESTADOS_SOLICITUD,
  MAX_BYTES_ARCHIVO,
  TIPOS_ARCHIVO,
  claveArticulo,
  folioSolicitud,
  hoyChihuahua,
  label,
  leerArticulos,
  leerCantidades,
  type Cantidades,
  type EstadoSolicitud,
} from "@/lib/entregas/catalogos"
import { aFormulario } from "@/lib/data/entregas"
import { leerSolicitudConLirabot } from "@/lib/entregas/ia"
import { campanaSchema, solicitudSchema, type CampanaInput, type SolicitudInput } from "@/lib/schemas/entregas"

// Acciones de Entregas. Cada una exige la sección "entregas" (lib/acceso.ts) y
// deja rastro en entregas_movimientos.

const refrescar = () => revalidatePath("/entregas", "layout")
const aFecha = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`) : null)
const primerError = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Revisa los datos."

async function usuario() {
  const s = await requerirArea("entregas")
  const id = Number.parseInt(String(s.user.id), 10)
  return { id: Number.isFinite(id) ? id : null, nombre: s.user.nombre ?? s.user.name ?? "Usuario" }
}

// --- Campañas --------------------------------------------------------------------------

export async function guardarCampana(
  id: number | null,
  input: CampanaInput
): Promise<{ ok: true; id: number; mensaje: string } | { ok: false; error: string }> {
  const u = await usuario()
  const p = campanaSchema.safeParse(input)
  if (!p.success) return { ok: false, error: primerError(p.error) }
  const d = p.data

  // Cada artículo conserva su clave al editar (ahí se guardan las cantidades).
  const usadas = new Set<string>()
  const articulos = d.articulos.map((a) => {
    let clave = a.clave || claveArticulo(a.nombre)
    while (usadas.has(clave)) clave = `${clave}_2`
    usadas.add(clave)
    return { clave, nombre: a.nombre, disponible: a.disponible }
  })
  const data = { nombre: d.nombre, anio: d.anio, prefijo: d.prefijo, descripcion: d.descripcion, articulos }
  if (id) {
    // Los folios ya entregados (DDN-001…) no deben cambiar de nombre.
    const actual = await prisma.entregaCampana.findUnique({ where: { id }, select: { prefijo: true, _count: { select: { solicitudes: true } } } })
    if (actual && actual.prefijo !== d.prefijo && actual._count.solicitudes > 0) {
      return { ok: false, error: `No se puede cambiar el prefijo: ya hay folios ${actual.prefijo}-### asignados.` }
    }
  }
  try {
    const c = id
      ? await prisma.entregaCampana.update({ where: { id }, data })
      : await prisma.entregaCampana.create({ data: { ...data, creadoPor: u.nombre } })
    refrescar()
    return { ok: true, id: c.id, mensaje: id ? "Entrega actualizada." : "Entrega creada. Ya puedes subir sus solicitudes." }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: `El prefijo ${d.prefijo} ya lo usa otra entrega. Elige otro (p. ej. ${d.prefijo}${String(d.anio).slice(2)}).` }
    }
    throw e
  }
}

export async function cambiarEstatusCampana(id: number, estatus: "abierta" | "cerrada"): Promise<ResultadoAccion> {
  await usuario()
  await prisma.entregaCampana.update({ where: { id }, data: { estatus } })
  refrescar()
  return exito(estatus === "cerrada" ? "Entrega cerrada: ya no recibe solicitudes nuevas." : "Entrega reabierta.")
}

// --- Solicitudes -------------------------------------------------------------------------

/** Sube un escaneo y le asigna el siguiente folio de la entrega (nunca se reutiliza). */
export async function registrarSolicitud(
  campanaId: number,
  formData: FormData
): Promise<{ ok: true; id: number; folio: string } | { ok: false; error: string }> {
  const u = await usuario()
  const archivo = formData.get("archivo")
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "No se recibió ningún archivo." }
  if (!TIPOS_ARCHIVO.includes(archivo.type)) return { ok: false, error: "Formato no admitido. Sube una foto (JPG, PNG) o un PDF." }
  if (archivo.size > MAX_BYTES_ARCHIVO) return { ok: false, error: "El archivo pesa más de 4 MB." }
  const campana = await prisma.entregaCampana.findUnique({ where: { id: campanaId }, select: { prefijo: true, estatus: true } })
  if (!campana) return { ok: false, error: "No se encontró la entrega." }
  if (campana.estatus !== "abierta") return { ok: false, error: "La entrega está cerrada; reábrela para subir solicitudes." }
  const contenido = Buffer.from(await archivo.arrayBuffer())

  for (let intento = 0; intento < 5; intento++) {
    const max = await prisma.entregaSolicitud.aggregate({ where: { campanaId }, _max: { consecutivo: true } })
    const consecutivo = (max._max.consecutivo ?? 0) + 1
    try {
      const s = await prisma.entregaSolicitud.create({
        data: {
          campanaId,
          consecutivo,
          creadoPorId: u.id,
          creadoPor: u.nombre,
          archivo: { create: { nombreOriginal: archivo.name.slice(0, 200), tipo: archivo.type, tamano: archivo.size, contenido } },
          movimientos: { create: { tipo: "registro", descripcion: `Solicitud recibida (${archivo.name.slice(0, 120)}).`, usuarioId: u.id, usuarioNombre: u.nombre } },
        },
      })
      refrescar()
      return { ok: true, id: s.id, folio: folioSolicitud(campana.prefijo, consecutivo) }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue
      throw e
    }
  }
  return { ok: false, error: "No se pudo asignar folio. Intenta de nuevo." }
}

/** Lirabot lee el escaneo. Si nadie ha confirmado la solicitud, guarda su propuesta. */
export async function leerSolicitud(id: number): Promise<ResultadoAccion> {
  const u = await usuario()
  const s = await prisma.entregaSolicitud.findFirst({
    where: { id, estatus: "activa" },
    include: { archivo: true, campana: { select: { articulos: true } } },
  })
  if (!s?.archivo) return fallo("No se encontró la solicitud o su escaneo.")
  const articulos = leerArticulos(s.campana.articulos)
  const r = await leerSolicitudConLirabot({ solicitudId: id, tipo: s.archivo.tipo, datos: new Uint8Array(s.archivo.contenido), articulos })
  if (!r.ok) {
    await prisma.entregaSolicitud.update({ where: { id }, data: { iaEstado: "error" } })
    return fallo(r.error)
  }
  if (s.revisado) {
    await prisma.entregaMovimiento.create({
      data: { solicitudId: id, tipo: "lectura_ia", descripcion: "Lirabot volvió a leerla; como ya estaba confirmada, no se cambió nada.", usuarioId: u.id, usuarioNombre: u.nombre },
    })
    return exito("Ya estaba confirmada: no se cambiaron sus datos.")
  }
  const d = r.datos
  const previas = leerCantidades(s.cantidades)
  const cantidades: Cantidades = { ...previas }
  for (const c of d.cantidades) cantidades[c.articulo] = { solicitado: c.cantidad, autorizado: previas[c.articulo]?.autorizado ?? null }
  const fecha = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? aFecha(v) : null)
  await prisma.entregaSolicitud.update({
    where: { id },
    data: {
      fechaSolicitud: fecha(d.fecha_solicitud),
      fechaEvento: fecha(d.fecha_evento),
      categoria: CATEGORIAS.some((c) => c.valor === d.categoria) ? d.categoria : "por_definir",
      solicitante: d.solicitante.trim().slice(0, 160),
      cargo: d.cargo.trim().slice(0, 160),
      organizacion: d.organizacion.trim().slice(0, 200),
      resumen: d.resumen.trim().slice(0, 1000),
      contacto: d.contacto.trim().slice(0, 300),
      cantidades,
      iaEstado: "leido",
      iaCamposDudosos: d.campos_dudosos,
      iaObservacion: d.observacion.trim().slice(0, 500),
      movimientos: { create: { tipo: "lectura_ia", descripcion: "Datos propuestos por Lirabot.", usuarioId: u.id, usuarioNombre: u.nombre } },
    },
  })
  refrescar()
  return exito("Lirabot la leyó. Revisa los datos y confírmalos.")
}

const ETIQUETAS: Record<string, string> = {
  fechaSolicitud: "fecha de solicitud",
  fechaEvento: "fecha del evento",
  categoria: "categoría",
  solicitante: "solicitante",
  cargo: "cargo",
  organizacion: "organización",
  resumen: "qué solicita",
  contacto: "contacto",
  observaciones: "observaciones",
  cantidades: "cantidades",
}

export async function guardarSolicitud(id: number, input: SolicitudInput, opciones: { confirmar?: boolean } = {}): Promise<ResultadoAccion> {
  const u = await usuario()
  const p = solicitudSchema.safeParse(input)
  if (!p.success) return fallo(primerError(p.error))
  const d = p.data
  const actual = await prisma.entregaSolicitud.findFirst({ where: { id, estatus: "activa" }, include: { campana: { select: { articulos: true } } } })
  if (!actual) return fallo("No se encontró la solicitud.")
  if (opciones.confirmar && !d.solicitante && !d.organizacion) return fallo("Para confirmar falta quién solicita (persona u organización).")

  const articulos = leerArticulos(actual.campana.articulos)
  const cantidades: Cantidades = {}
  for (const a of articulos) {
    const solicitado = d.solicitado[a.clave] ?? null
    const autorizado = d.autorizado[a.clave] ?? null
    if (solicitado !== null || autorizado !== null) cantidades[a.clave] = { solicitado, autorizado }
  }
  const nuevo = {
    fechaSolicitud: aFecha(d.fechaSolicitud),
    fechaEvento: aFecha(d.fechaEvento),
    categoria: d.categoria,
    solicitante: d.solicitante,
    cargo: d.cargo,
    organizacion: d.organizacion,
    resumen: d.resumen,
    contacto: d.contacto,
    observaciones: d.observaciones,
    cantidades,
  }
  const antes = aFormulario(actual, articulos)
  const despues = aFormulario({ ...nuevo, cantidades }, articulos)
  const cambios = Object.keys(ETIQUETAS).filter((k) =>
    k === "cantidades"
      ? JSON.stringify([antes.solicitado, antes.autorizado]) !== JSON.stringify([despues.solicitado, despues.autorizado])
      : (antes as Record<string, unknown>)[k] !== (despues as Record<string, unknown>)[k]
  )
  await prisma.entregaSolicitud.update({
    where: { id },
    data: {
      ...nuevo,
      ...(opciones.confirmar ? { revisado: true, iaCamposDudosos: [] } : {}),
      movimientos: {
        create: {
          tipo: opciones.confirmar ? "revision" : "edicion",
          descripcion: opciones.confirmar
            ? "Datos confirmados."
            : cambios.length
              ? `Se editó: ${cambios.map((k) => ETIQUETAS[k]).join(", ")}.`
              : "Guardado sin cambios.",
          usuarioId: u.id,
          usuarioNombre: u.nombre,
        },
      },
    },
  })
  refrescar()
  return exito(opciones.confirmar ? "Datos confirmados." : "Cambios guardados.")
}

/**
 * Avanza el estado. Autorizar exige cantidades; entregar, que haya algo
 * autorizado; "no procede", un motivo. Todo queda en la bitácora.
 */
export async function cambiarEstadoSolicitud(
  id: number,
  estado: EstadoSolicitud,
  extra: { autorizado?: Record<string, string>; fechaEntrega?: string; recibio?: string; nota?: string } = {}
): Promise<ResultadoAccion> {
  const u = await usuario()
  if (!ESTADOS_SOLICITUD.some((e) => e.valor === estado)) return fallo("Estado inválido.")
  const s = await prisma.entregaSolicitud.findFirst({ where: { id, estatus: "activa" }, include: { campana: { select: { articulos: true } } } })
  if (!s) return fallo("No se encontró la solicitud.")
  const nota = (extra.nota ?? "").replace(/\s+/g, " ").trim().slice(0, 300)
  const articulos = leerArticulos(s.campana.articulos)
  const cantidades = leerCantidades(s.cantidades)

  if (extra.autorizado) {
    for (const a of articulos) {
      const v = (extra.autorizado[a.clave] ?? "").replace(/[^\d]/g, "")
      const n = v === "" ? null : Number(v)
      cantidades[a.clave] = { solicitado: cantidades[a.clave]?.solicitado ?? null, autorizado: n }
    }
  }
  const totalAutorizado = Object.values(cantidades).reduce((t, c) => t + (c.autorizado ?? 0), 0)
  if ((estado === "autorizada" || estado === "contactada" || estado === "entregada") && totalAutorizado === 0) {
    return fallo("Primero indica cuánto se autoriza de al menos un artículo.")
  }
  if (estado === "no_procede" && nota.length < 3) return fallo("Indica por qué no procede.")
  const fechaEntrega = estado === "entregada" ? (extra.fechaEntrega && /^\d{4}-\d{2}-\d{2}$/.test(extra.fechaEntrega) ? extra.fechaEntrega : hoyChihuahua()) : null
  const recibio = estado === "entregada" ? (extra.recibio ?? "").replace(/\s+/g, " ").trim().slice(0, 160) : s.recibio

  const resumenAut = articulos
    .filter((a) => (cantidades[a.clave]?.autorizado ?? 0) > 0)
    .map((a) => `${cantidades[a.clave]!.autorizado} ${a.nombre.toLowerCase()}`)
    .join(", ")
  const detalle =
    estado === "autorizada"
      ? ` Autorizado: ${resumenAut}.`
      : estado === "entregada"
        ? ` Entregado el ${fechaEntrega}${recibio ? ` a ${recibio}` : ""}: ${resumenAut}.`
        : ""
  await prisma.entregaSolicitud.update({
    where: { id },
    data: {
      estado,
      cantidades,
      ...(estado === "entregada" ? { fechaEntrega: aFecha(fechaEntrega), recibio } : {}),
      movimientos: {
        create: {
          tipo: "estado",
          descripcion: `${label(ESTADOS_SOLICITUD, s.estado)} → ${label(ESTADOS_SOLICITUD, estado)}.${detalle}${nota ? ` ${nota}` : ""}`,
          usuarioId: u.id,
          usuarioNombre: u.nombre,
        },
      },
    },
  })
  refrescar()
  return exito(`Solicitud ${label(ESTADOS_SOLICITUD, estado).toLowerCase()}.`)
}

/** Un escaneo subido por error (duplicado, archivo equivocado). No se borra; su folio no se reutiliza. */
export async function anularSolicitud(id: number, motivo: string): Promise<ResultadoAccion> {
  const u = await usuario()
  const limpio = motivo.replace(/\s+/g, " ").trim().slice(0, 300)
  if (limpio.length < 3) return fallo("Indica el motivo de la anulación.")
  await prisma.entregaSolicitud.update({
    where: { id },
    data: { estatus: "baja", movimientos: { create: { tipo: "anulacion", descripcion: `Registro anulado: ${limpio}`, usuarioId: u.id, usuarioNombre: u.nombre } } },
  })
  refrescar()
  return exito("Registro anulado.")
}
