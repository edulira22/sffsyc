import { z } from "zod"

export const claseSchema = z.object({
  nombreOficial: z.string().trim().min(1, "El nombre oficial es obligatorio"),
  categoriaId: z
    .number({ message: "Selecciona una categoría" })
    .int()
    .positive("Selecciona una categoría"),
  descripcion: z.string().trim().optional().or(z.literal("")),
  variantesAlias: z.string().trim().optional().or(z.literal("")),
})

export type ClaseInput = z.infer<typeof claseSchema>
