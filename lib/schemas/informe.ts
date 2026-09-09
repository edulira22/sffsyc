import { z } from "zod"

import { VALORES_PARENTESCO } from "@/lib/eventos/informe"

// Todos los campos son obligatorios: el evento requiere el registro completo
// del colaborador y de su familiar invitado.

export const registroInformeSchema = z.object({
  colaborador: z
    .string()
    .trim()
    .min(5, "Escribe el nombre completo del colaborador")
    .max(120, "El nombre es demasiado largo"),
  area: z
    .string()
    .trim()
    .min(3, "Indica tu área, departamento o centro de trabajo")
    .max(120, "El texto es demasiado largo"),
  invitado: z
    .string()
    .trim()
    .min(5, "Escribe el nombre completo del familiar invitado")
    .max(120, "El nombre es demasiado largo"),
  parentesco: z
    .string()
    .refine((v) => VALORES_PARENTESCO.includes(v), {
      message: "Selecciona el parentesco del invitado",
    }),
})

export type RegistroInformeInput = z.infer<typeof registroInformeSchema>

export const VALORES_INICIALES_INFORME: RegistroInformeInput = {
  colaborador: "",
  area: "",
  invitado: "",
  parentesco: "",
}
