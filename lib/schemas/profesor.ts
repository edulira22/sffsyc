import { z } from "zod"

export const profesorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellidoPaterno: z.string().trim().min(1, "El apellido paterno es obligatorio"),
  apellidoMaterno: z.string().trim().optional().or(z.literal("")),
  telefono: z.string().trim().optional().or(z.literal("")),
  especialidad: z.string().trim().optional().or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
})

export type ProfesorInput = z.infer<typeof profesorSchema>
