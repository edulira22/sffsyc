import { z } from "zod"

export const inscripcionSchema = z.object({
  claseCentroId: z
    .number({ message: "Selecciona una clase" })
    .int()
    .positive("Selecciona una clase"),
  fechaInscripcion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  observaciones: z.string().trim().optional().or(z.literal("")),
})

export type InscripcionInput = z.infer<typeof inscripcionSchema>
