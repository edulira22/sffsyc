import { z } from "zod"

export const ESCOLARIDADES = [
  "sin_escolaridad",
  "preescolar",
  "primaria",
  "secundaria",
  "preparatoria",
  "universidad",
  "otro",
] as const

export const ESCOLARIDAD_LABEL: Record<(typeof ESCOLARIDADES)[number], string> = {
  sin_escolaridad: "Sin escolaridad",
  preescolar: "Preescolar",
  primaria: "Primaria",
  secundaria: "Secundaria",
  preparatoria: "Preparatoria",
  universidad: "Universidad",
  otro: "Otro",
}

// Grado y escuela solo aplican a niveles básicos/medios.
export function aplicaGradoEscuela(escolaridad?: string | null): boolean {
  return (
    !!escolaridad &&
    escolaridad !== "universidad" &&
    escolaridad !== "sin_escolaridad"
  )
}

export const beneficiarioSchema = z.object({
  apellidoPaterno: z.string().trim().min(1, "El apellido paterno es obligatorio"),
  apellidoMaterno: z.string().trim().optional().or(z.literal("")),
  nombres: z.string().trim().min(1, "El nombre es obligatorio"),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha de nacimiento válida"),
  curp: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z0-9]{18}$/.test(v), {
      message: "La CURP debe tener 18 caracteres",
    })
    .optional()
    .or(z.literal("")),
  telefono: z.string().trim().optional().or(z.literal("")),
  domicilio: z.string().trim().optional().or(z.literal("")),
  escolaridad: z.enum(ESCOLARIDADES).optional().nullable(),
  gradoEscolar: z.string().trim().optional().or(z.literal("")),
  nombreEscuela: z.string().trim().optional().or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
})

export type BeneficiarioInput = z.infer<typeof beneficiarioSchema>

export const ESTATUS_BENEFICIARIO_LABEL: Record<
  "activo" | "inactivo" | "baja",
  string
> = {
  activo: "Activo",
  inactivo: "Inactivo",
  baja: "Baja",
}
