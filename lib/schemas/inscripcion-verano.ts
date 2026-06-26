import { z } from "zod"

// Validación del formulario público de inscripción a Verano DIFertido.
// Obligatorio: identidad del NNA y contacto principal. Los teléfonos deben
// traer 10 dígitos; los opcionales aceptan vacío o 10 dígitos.

const telObligatorio = (msg: string) =>
  z.string().trim().regex(/^\d{10}$/, msg)

const telOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{10}$/.test(v), "El teléfono debe tener 10 dígitos")
  .default("")

const autorizadoSchema = z.object({
  nombre: z.string().trim().default(""),
  celular: telOpcional,
  parentesco: z.string().trim().default(""),
})

export const inscripcionVeranoSchema = z.object({
  // --- NNA (obligatorio) ---
  nombre: z.string().trim().min(1, "El nombre del NNA es obligatorio"),
  curp: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÑ]{4}\d{6}[A-Z]{6}[A-Z\d]{2}$/, "La CURP debe tener 18 caracteres válidos"),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Captura la fecha de nacimiento"),
  talla: z.string().trim().min(1, "Selecciona la talla"),
  primeraVez: z.boolean(),
  fechaInscripcion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  // --- Tutores ---
  // Nombres opcionales (custodia / familias monoparentales); contacto obligatorio.
  padre: z.string().trim().default(""),
  celularPadre: telOpcional,
  madre: z.string().trim().default(""),
  celularMadre: telOpcional,
  telefonoCasa: telObligatorio("El teléfono de casa debe tener 10 dígitos"),
  celularWhatsapp: telObligatorio("El celular de WhatsApp debe tener 10 dígitos"),
  domicilio: z.string().trim().min(1, "Captura el domicilio"),

  // --- Opcional: autorizados para recoger ---
  autorizados: z.array(autorizadoSchema).max(3).default([]),

  // --- Salud (opcional) ---
  enfermedades: z.string().trim().default(""),
  impideActividad: z.string().trim().default(""),
  medicamentos: z.string().trim().default(""),
  alergias: z.string().trim().default(""),
  nombreServicioMedico: z.string().trim().default(""),
  numeroServicioMedico: z.string().trim().default(""),
  nombreMedico: z.string().trim().default(""),
  telefonoMedico: telOpcional,

  // --- Firma ---
  nombreFirma: z.string().trim().min(1, "Falta el nombre de quien inscribe"),
  aceptaReglamento: z
    .boolean()
    .refine((v) => v === true, "Debes aceptar el reglamento para continuar"),
})

export type InscripcionVeranoInput = z.infer<typeof inscripcionVeranoSchema>
