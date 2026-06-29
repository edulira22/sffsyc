"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requerirSesion } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import {
  DOCUMENTOS_VERANO,
  grupoSugeridoPorEdad,
  grupoPorId,
} from "@/lib/eventos/verano"
import {
  inscripcionVeranoSchema,
  type InscripcionVeranoInput,
} from "@/lib/schemas/inscripcion-verano"
import { edadDeISO } from "@/lib/fechas"
import { aTitulo, aOracion, soloDigitos } from "@/lib/texto"

// Actualiza el status de requisitos de un NNA (uso interno): documentos
// entregados y número de recibo de pago.
export async function actualizarStatusVerano(
  id: number,
  documentos: string[],
  reciboPago: string
): Promise<ResultadoAccion> {
  await requerirSesion()

  const validos = documentos.filter((d) =>
    DOCUMENTOS_VERANO.some((doc) => doc.id === d)
  )
  const recibo = reciboPago.trim()

  try {
    await prisma.inscripcionVerano.update({
      where: { id },
      data: { documentos: validos, reciboPago: recibo || null },
    })
    revalidatePath(`/eventos/verano-difertido/inscripciones/${id}`)
    revalidatePath("/eventos/verano-difertido/inscripciones")
    return exito("Status actualizado")
  } catch {
    return fallo("No se pudo actualizar el status.")
  }
}

// Edita los datos finales del NNA (uso interno). No toca documentos ni recibo
// (esos se manejan en el panel de status). El equipo se puede sobrescribir
// manualmente; si se deja vacío, se vuelve a sugerir por la edad.
export async function editarInscripcionVerano(
  id: number,
  input: InscripcionVeranoInput
): Promise<ResultadoAccion> {
  await requerirSesion()

  const parsed = inscripcionVeranoSchema.safeParse(input)
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  }
  const d = parsed.data

  // Equipo: respeta el override manual si es válido; si no, sugiere por edad.
  const grupoManual = grupoPorId(d.grupo ?? "")?.id
  const grupo =
    grupoManual ?? grupoSugeridoPorEdad(edadDeISO(d.fechaNacimiento))?.id ?? null

  const autorizados = d.autorizados
    .filter((a) => a.nombre || a.celular || a.parentesco)
    .map((a) => ({
      nombre: aTitulo(a.nombre),
      celular: soloDigitos(a.celular),
      parentesco: aTitulo(a.parentesco),
    }))

  try {
    await prisma.inscripcionVerano.update({
      where: { id },
      data: {
        nombre: aTitulo(d.nombre),
        curp: d.curp.toUpperCase() || null,
        fechaNacimiento: new Date(`${d.fechaNacimiento}T12:00:00`),
        talla: d.talla || null,
        primeraVez: d.primeraVez,
        grupo,
        fechaInscripcion: d.fechaInscripcion
          ? new Date(`${d.fechaInscripcion}T12:00:00`)
          : undefined,
        padre: aTitulo(d.padre) || null,
        celularPadre: soloDigitos(d.celularPadre) || null,
        madre: aTitulo(d.madre) || null,
        celularMadre: soloDigitos(d.celularMadre) || null,
        telefonoCasa: soloDigitos(d.telefonoCasa) || null,
        celularWhatsapp: soloDigitos(d.celularWhatsapp) || null,
        domicilio: aOracion(d.domicilio) || null,
        autorizados,
        enfermedades: aOracion(d.enfermedades) || null,
        impideActividad: aOracion(d.impideActividad) || null,
        medicamentos: aOracion(d.medicamentos) || null,
        alergias: aOracion(d.alergias) || null,
        nombreServicioMedico: aTitulo(d.nombreServicioMedico) || null,
        numeroServicioMedico: d.numeroServicioMedico || null,
        nombreMedico: aTitulo(d.nombreMedico) || null,
        telefonoMedico: soloDigitos(d.telefonoMedico) || null,
        nombreFirma: aTitulo(d.nombreFirma),
      },
    })
    revalidatePath(`/eventos/verano-difertido/inscripciones/${id}`)
    revalidatePath("/eventos/verano-difertido/inscripciones")
    return exito("Datos actualizados")
  } catch {
    return fallo("No se pudieron guardar los cambios.")
  }
}
