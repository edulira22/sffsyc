import { z } from "zod"

// Esquema de validación compartido entre el formulario (cliente) y la
// Server Action (servidor). Fuente única de verdad.
export const coordinadoraSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),
    apellidoPaterno: z
      .string()
      .trim()
      .min(1, "El apellido paterno es obligatorio"),
    apellidoMaterno: z.string().trim().optional().or(z.literal("")),
    telefono: z.string().trim().optional().or(z.literal("")),
    rol: z.enum(["general", "zona", "centro"], {
      message: "Selecciona un rol",
    }),
    zonaId: z.number().int().positive().nullable().optional(),
  })
  .refine((d) => d.rol !== "zona" || d.zonaId != null, {
    message: "La coordinadora de zona requiere una zona asignada",
    path: ["zonaId"],
  })

export type CoordinadoraInput = z.infer<typeof coordinadoraSchema>

export const ROL_COORDINADORA_LABEL: Record<
  "general" | "zona" | "centro",
  string
> = {
  general: "Coordinación general",
  zona: "Coordinadora de zona",
  centro: "Coordinadora de centro",
}
