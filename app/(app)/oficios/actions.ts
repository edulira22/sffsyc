"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import {
  ESTADOS_OFICIO,
  MAX_BYTES_ARCHIVO,
  TIPOS_ARCHIVO_PERMITIDOS,
  folioOficio,
  hoyChihuahua,
  label,
  type EstadoOficio,
} from "@/lib/oficios/catalogos"
import { leerOficioConClaude, type LecturaOficio } from "@/lib/oficios/ia"
import { aFormulario } from "@/lib/data/oficios"
import { faltantesParaConfirmar, oficioSchema, type OficioInput } from "@/lib/schemas/oficio"

type Ok<T = object> = { ok: true; mensaje?: string } & T
type Fallo = { ok: false; error: string }

const RUTA = "/oficios"

async function usuario() {
  const s = await requerirSesion()
  const id = Number.parseInt(String(s.user.id), 10)
  return { id: Number.isFinite(id) ? id : null, nombre: s.user.nombre ?? s.user.name ?? "Usuario" }
}

const aFecha = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`) : null)

/** AAAA-MM-DD real y de un año razonable; si no, null. */
function fechaValida(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const d = new Date(`${v}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return null
  const anio = d.getUTCFullYear()
  const actual = new Date().getUTCFullYear()
  return anio >= 2000 && anio <= actual + 2 ? v : null
}

// --- Registrar (subir el escaneo y asignar folio) ----------------------------

/**
 * Guarda el escaneo y asigna el folio. El oficio queda "sin revisar" hasta
 * que una persona confirme sus datos. El folio se asigna aquí (al recibir),
 * como en una oficialía de partes, y nunca se reutiliza.
 */
export async function registrarOficio(formData: FormData): Promise<Ok<{ id: number; folio: string }> | Fallo> {
  const u = await usuario()
  const archivo = formData.get("archivo")
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "No se recibió ningún archivo." }
  if (!TIPOS_ARCHIVO_PERMITIDOS.includes(archivo.type)) {
    return { ok: false, error: "Formato no admitido. Sube una foto (JPG, PNG) o un PDF." }
  }
  if (archivo.size > MAX_BYTES_ARCHIVO) {
    return { ok: false, error: "El archivo pesa más de 4 MB. Escanéalo con menor resolución o en blanco y negro." }
  }
  const nombreOriginal = String(formData.get("nombreOriginal") || archivo.name || "oficio").slice(0, 200)
  const contenido = Buffer.from(await archivo.arrayBuffer())
  const hoy = hoyChihuahua()
  const anio = Number(hoy.slice(0, 4))

  for (let intento = 0; intento < 5; intento++) {
    const max = await prisma.oficio.aggregate({ _max: { consecutivo: true }, where: { anio } })
    const consecutivo = (max._max.consecutivo ?? 0) + 1
    try {
      const o = await prisma.oficio.create({
        data: {
          anio,
          consecutivo,
          fechaRecepcion: aFecha(hoy)!,
          creadoPorId: u.id,
          creadoPorNombre: u.nombre,
          archivo: { create: { nombreOriginal, tipo: archivo.type, tamano: contenido.length, contenido } },
          movimientos: {
            create: {
              tipo: "registro",
              descripcion: `Oficio registrado (${nombreOriginal}, ${Math.max(1, Math.round(contenido.length / 1024))} KB).`,
              usuarioId: u.id,
              usuarioNombre: u.nombre,
            },
          },
        },
        select: { id: true },
      })
      revalidatePath(RUTA)
      return { ok: true, id: o.id, folio: folioOficio(anio, consecutivo) }
    } catch (e) {
      // Dos personas registrando a la vez: el folio chocó, se toma el siguiente.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue
      return { ok: false, error: "No se pudo guardar el oficio. Intenta de nuevo." }
    }
  }
  return { ok: false, error: "No se pudo asignar folio. Intenta de nuevo." }
}

// --- Leer con IA --------------------------------------------------------------

function propuestaDesdeIA(d: LecturaOficio, actual: OficioInput): OficioInput {
  return {
    ...actual,
    numeroOficio: d.numero_oficio.trim(),
    numeroRecepcion: d.numero_recepcion.trim(),
    fechaDocumento: fechaValida(d.fecha_documento) ?? "",
    fechaRecepcion: fechaValida(d.fecha_recepcion) ?? actual.fechaRecepcion,
    remitente: d.remitente.trim(),
    cargoRemitente: d.cargo_remitente.trim(),
    dependencia: d.dependencia.trim(),
    dirigidoA: d.dirigido_a.trim(),
    tipo: d.tipo,
    asunto: d.asunto.trim(),
    resumen: d.resumen.trim(),
    areaResponsable: d.area_responsable,
    prioridad: d.prioridad,
    requiereRespuesta: d.requiere_respuesta,
    fechaLimite: fechaValida(d.fecha_limite) ?? "",
  }
}

/**
 * Lee el escaneo con IA. Si el oficio aún no está revisado, guarda la
 * propuesta; si ya lo está, solo la devuelve para que la persona decida.
 */
export async function leerOficio(id: number): Promise<
  Ok<{ formulario: OficioInput; dudosos: string[]; observacion: string; guardado: boolean; costoUsd: number }> | Fallo
> {
  const u = await usuario()
  const o = await prisma.oficio.findFirst({
    where: { id, estatus: "activo" },
    include: { archivo: true },
  })
  if (!o?.archivo) return { ok: false, error: "No se encontró el oficio o su archivo." }

  const r = await leerOficioConClaude({
    oficioId: o.id,
    tipo: o.archivo.tipo,
    datos: new Uint8Array(o.archivo.contenido),
  })

  if (!r.ok) {
    if (!o.revisado) await prisma.oficio.update({ where: { id }, data: { iaEstado: "error" } })
    return { ok: false, error: r.error }
  }

  const formulario = propuestaDesdeIA(r.datos, aFormulario(o))
  const dudosos = r.datos.campos_dudosos
  const observacion = r.datos.observacion.trim()
  const costoTxt = `US$ ${r.costoUsd.toFixed(4)}`

  if (!o.revisado) {
    const p = oficioSchema.parse(formulario)
    await prisma.oficio.update({
      where: { id },
      data: {
        ...datosOficio(p),
        iaEstado: "leido",
        iaCamposDudosos: dudosos,
        iaObservacion: observacion,
        movimientos: {
          create: {
            tipo: "lectura_ia",
            descripcion: `Datos propuestos por Lirabot (${r.modelo}, ${costoTxt}).`,
            usuarioId: u.id,
            usuarioNombre: u.nombre,
          },
        },
      },
    })
    revalidatePath(RUTA)
  } else {
    await prisma.oficioMovimiento.create({
      data: {
        oficioId: id,
        tipo: "lectura_ia",
        descripcion: `Lirabot volvió a leer el oficio (${r.modelo}, ${costoTxt}); la propuesta no se aplicó automáticamente.`,
        usuarioId: u.id,
        usuarioNombre: u.nombre,
      },
    })
  }

  return { ok: true, formulario, dudosos, observacion, guardado: !o.revisado, costoUsd: r.costoUsd }
}

// --- Guardar datos ------------------------------------------------------------

function datosOficio(d: ReturnType<typeof oficioSchema.parse>) {
  return {
    numeroOficio: d.numeroOficio,
    numeroRecepcion: d.numeroRecepcion,
    fechaDocumento: aFecha(d.fechaDocumento),
    fechaRecepcion: aFecha(d.fechaRecepcion)!,
    remitente: d.remitente,
    cargoRemitente: d.cargoRemitente,
    dependencia: d.dependencia,
    dirigidoA: d.dirigidoA,
    tipo: d.tipo,
    asunto: d.asunto,
    resumen: d.resumen,
    areaResponsable: d.areaResponsable,
    prioridad: d.prioridad,
    requiereRespuesta: d.requiereRespuesta,
    fechaLimite: aFecha(d.fechaLimite),
    respuestaNumero: d.respuestaNumero,
    respuestaFecha: aFecha(d.respuestaFecha),
  }
}

const ETIQUETAS: Record<keyof OficioInput, string> = {
  numeroOficio: "número de oficio",
  numeroRecepcion: "número de recepción",
  fechaDocumento: "fecha del documento",
  fechaRecepcion: "fecha de recepción",
  remitente: "remitente",
  cargoRemitente: "cargo",
  dependencia: "dependencia",
  dirigidoA: "dirigido a",
  tipo: "tipo",
  asunto: "asunto",
  resumen: "detalles",
  areaResponsable: "área responsable",
  prioridad: "prioridad",
  requiereRespuesta: "requiere respuesta",
  fechaLimite: "fecha límite",
  respuestaNumero: "número de respuesta",
  respuestaFecha: "fecha de respuesta",
}

/**
 * Guarda los datos del oficio. Con `confirmar`, además lo marca como
 * revisado (la persona da fe de que los datos corresponden al escaneo).
 */
export async function guardarOficio(
  id: number,
  input: OficioInput,
  opciones: { confirmar?: boolean } = {}
): Promise<Ok | Fallo> {
  const u = await usuario()
  const parsed = oficioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." }
  const d = parsed.data

  const actual = await prisma.oficio.findFirst({ where: { id, estatus: "activo" } })
  if (!actual) return { ok: false, error: "No se encontró el oficio." }

  if (opciones.confirmar) {
    const faltan = faltantesParaConfirmar(d)
    if (faltan.length) return { ok: false, error: `Para confirmar falta ${faltan.join(" y ")}.` }
  }

  const antes = aFormulario(actual)
  const despues = { ...input, ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ?? ""])) } as OficioInput
  const cambios = (Object.keys(ETIQUETAS) as (keyof OficioInput)[]).filter(
    (k) => String(antes[k] ?? "") !== String(despues[k] ?? "")
  )
  const confirmaAhora = Boolean(opciones.confirmar && !actual.revisado)
  if (!cambios.length && !confirmaAhora) return { ok: true, mensaje: "Sin cambios." }

  const partes: string[] = []
  if (confirmaAhora) partes.push("Datos revisados y confirmados")
  if (cambios.length) partes.push(`${confirmaAhora ? "con cambios en" : "Se editó"}: ${cambios.map((k) => ETIQUETAS[k]).join(", ")}`)

  await prisma.oficio.update({
    where: { id },
    data: {
      ...datosOficio(d),
      ...(confirmaAhora ? { revisado: true } : {}),
      movimientos: {
        create: {
          tipo: confirmaAhora ? "revision" : "edicion",
          descripcion: `${partes.join(" ")}.`,
          usuarioId: u.id,
          usuarioNombre: u.nombre,
        },
      },
    },
  })
  revalidatePath(RUTA)
  revalidatePath(`${RUTA}/${id}`)
  return { ok: true, mensaje: confirmaAhora ? "Oficio confirmado." : "Cambios guardados." }
}

// --- Seguimiento --------------------------------------------------------------

export async function cambiarEstadoOficio(id: number, estado: EstadoOficio, nota: string): Promise<Ok | Fallo> {
  const u = await usuario()
  if (!ESTADOS_OFICIO.some((e) => e.valor === estado)) return { ok: false, error: "Estado inválido." }
  const o = await prisma.oficio.findFirst({ where: { id, estatus: "activo" }, select: { estado: true } })
  if (!o) return { ok: false, error: "No se encontró el oficio." }
  if (o.estado === estado) return { ok: true, mensaje: "Sin cambios." }
  const limpia = nota.replace(/\s+/g, " ").trim().slice(0, 1000)
  if (estado === "archivado" && !limpia) return { ok: false, error: "Indica por qué se archiva." }

  await prisma.oficio.update({
    where: { id },
    data: {
      estado,
      movimientos: {
        create: {
          tipo: "estado",
          descripcion: `${label(ESTADOS_OFICIO, o.estado)} → ${label(ESTADOS_OFICIO, estado)}${limpia ? `: ${limpia}` : "."}`,
          usuarioId: u.id,
          usuarioNombre: u.nombre,
        },
      },
    },
  })
  revalidatePath(RUTA)
  revalidatePath(`${RUTA}/${id}`)
  return { ok: true, mensaje: `Estado: ${label(ESTADOS_OFICIO, estado)}.` }
}

export async function agregarNotaOficio(id: number, nota: string): Promise<Ok | Fallo> {
  const u = await usuario()
  const limpia = nota.replace(/\s+/g, " ").trim().slice(0, 1000)
  if (limpia.length < 2) return { ok: false, error: "Escribe la nota." }
  const existe = await prisma.oficio.count({ where: { id, estatus: "activo" } })
  if (!existe) return { ok: false, error: "No se encontró el oficio." }
  await prisma.oficioMovimiento.create({
    data: { oficioId: id, tipo: "nota", descripcion: limpia, usuarioId: u.id, usuarioNombre: u.nombre },
  })
  revalidatePath(`${RUTA}/${id}`)
  return { ok: true, mensaje: "Nota agregada." }
}

/**
 * Anula un registro hecho por error (archivo equivocado, duplicado). No se
 * borra: queda con estatus "baja" y su folio no se reutiliza.
 */
export async function anularOficio(id: number, motivo: string): Promise<Ok | Fallo> {
  const u = await usuario()
  const limpio = motivo.replace(/\s+/g, " ").trim().slice(0, 500)
  if (limpio.length < 3) return { ok: false, error: "Indica el motivo de la anulación." }
  const o = await prisma.oficio.findFirst({ where: { id, estatus: "activo" }, select: { id: true } })
  if (!o) return { ok: false, error: "No se encontró el oficio." }
  await prisma.oficio.update({
    where: { id },
    data: {
      estatus: "baja",
      movimientos: {
        create: { tipo: "anulacion", descripcion: `Registro anulado: ${limpio}`, usuarioId: u.id, usuarioNombre: u.nombre },
      },
    },
  })
  revalidatePath(RUTA)
  return { ok: true, mensaje: "Registro anulado." }
}
