"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  inscripcionVeranoSchema,
  type InscripcionVeranoInput,
} from "@/lib/schemas/inscripcion-verano"
import { grupoSugeridoPorEdad, folioVerano } from "@/lib/eventos/verano"
import { edadDeISO } from "@/lib/fechas"

export type ResultadoInscripcion =
  | { ok: true; id: number; folio: string }
  | { ok: false; error: string }

// Guarda una inscripción del curso de verano. Ruta PÚBLICA: cualquiera puede
// enviarla (autoservicio o staff). No requiere sesión.
export async function crearInscripcionVerano(
  input: InscripcionVeranoInput
): Promise<ResultadoInscripcion> {
  const parsed = inscripcionVeranoSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const d = parsed.data

  // El equipo se sugiere por la edad calculada de la fecha de nacimiento.
  const edad = edadDeISO(d.fechaNacimiento)
  const grupo = grupoSugeridoPorEdad(edad)?.id ?? null

  // Se descartan autorizados vacíos.
  const autorizados = d.autorizados.filter(
    (a) => a.nombre || a.celular || a.parentesco
  )

  try {
    const insc = await prisma.inscripcionVerano.create({
      data: {
        nombre: d.nombre,
        curp: d.curp || null,
        fechaNacimiento: new Date(`${d.fechaNacimiento}T12:00:00`),
        talla: d.talla || null,
        grupo,
        fechaInscripcion: d.fechaInscripcion
          ? new Date(`${d.fechaInscripcion}T12:00:00`)
          : new Date(),
        padre: d.padre || null,
        celularPadre: d.celularPadre || null,
        madre: d.madre || null,
        celularMadre: d.celularMadre || null,
        telefonoCasa: d.telefonoCasa || null,
        celularWhatsapp: d.celularWhatsapp || null,
        domicilio: d.domicilio || null,
        autorizados,
        enfermedades: d.enfermedades || null,
        impideActividad: d.impideActividad || null,
        medicamentos: d.medicamentos || null,
        alergias: d.alergias || null,
        nombreServicioMedico: d.nombreServicioMedico || null,
        numeroServicioMedico: d.numeroServicioMedico || null,
        nombreMedico: d.nombreMedico || null,
        telefonoMedico: d.telefonoMedico || null,
        nombreFirma: d.nombreFirma,
        aceptaReglamento: d.aceptaReglamento,
      },
      select: { id: true },
    })

    revalidatePath("/eventos/verano-difertido/inscripciones")
    return { ok: true, id: insc.id, folio: folioVerano(insc.id) }
  } catch (e) {
    // Mensaje claro si la tabla aún no existe en la base de datos.
    const msg = e instanceof Error ? e.message : "Error desconocido"
    if (msg.includes("inscripciones_verano") || msg.includes("does not exist")) {
      return {
        ok: false,
        error:
          "La tabla de inscripciones aún no está disponible en la base de datos. Avisa al administrador.",
      }
    }
    return { ok: false, error: "No se pudo guardar la inscripción. Intenta de nuevo." }
  }
}
