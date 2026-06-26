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
  nombre: z.string().trim().min(1, "El nombre del NNA es obligatorio"),
  curp: z.string().trim().toUpperCase().max(18).optional().default(""),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Captura la fecha de nacimiento"),
  talla: z.string().trim().default(""),
  fechaInscripcion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  padre: z.string().trim().default(""),
  celularPadre: z.string().trim().default(""),
  madre: z.string().trim().default(""),
  celularMadre: z.string().trim().default(""),
  telefonoCasa: z.string().trim().default(""),
  celularWhatsapp: z.string().trim().default(""),
  domicilio: z.string().trim().default(""),

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
