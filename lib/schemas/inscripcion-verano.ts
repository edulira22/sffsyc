import { z } from "zod"

// Validación del formulario público de inscripción a Verano DIFertido.
// Solo lo esencial es obligatorio para no frenar la captura presencial; el
// resto es opcional (se puede completar después en el expediente).

const autorizadoSchema = z.object({
  nombre: z.string().trim().default(""),
  celular: z.string().trim().default(""),
  parentesco: z.string().trim().default(""),
})

export const inscripcionVeranoSchema = z.object({
  // Obligatorios: identidad del NNA y contacto principal.
  nombre: z.string().trim().min(1, "El nombre del NNA es obligatorio"),
  curp: z.string().trim().toUpperCase().min(1, "Captura la CURP del NNA").max(18),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Captura la fecha de nacimiento"),
  talla: z.string().trim().min(1, "Selecciona la talla"),
  fechaInscripcion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  // Tutores: los nombres son opcionales (caso de custodia / familias
  // monoparentales), pero el contacto principal sí es obligatorio.
  padre: z.string().trim().default(""),
  celularPadre: z.string().trim().default(""),
  madre: z.string().trim().default(""),
  celularMadre: z.string().trim().default(""),
  telefonoCasa: z.string().trim().min(1, "Captura el teléfono de casa"),
  celularWhatsapp: z.string().trim().min(1, "Captura el celular para WhatsApp"),
  domicilio: z.string().trim().min(1, "Captura el domicilio"),

  // Opcional: autorizados para recoger.
  autorizados: z.array(autorizadoSchema).max(3).default([]),

  enfermedades: z.string().trim().default(""),
  impideActividad: z.string().trim().default(""),
  medicamentos: z.string().trim().default(""),
  alergias: z.string().trim().default(""),
  nombreServicioMedico: z.string().trim().default(""),
  numeroServicioMedico: z.string().trim().default(""),
  nombreMedico: z.string().trim().default(""),
  telefonoMedico: z.string().trim().default(""),

  nombreFirma: z.string().trim().min(1, "Falta el nombre de quien inscribe"),
  aceptaReglamento: z
    .boolean()
    .refine((v) => v === true, "Debes aceptar el reglamento para continuar"),
})

export type InscripcionVeranoInput = z.infer<typeof inscripcionVeranoSchema>
