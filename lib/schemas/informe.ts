import { z } from "zod"

import { MAX_INVITADOS, VALORES_PARENTESCO } from "@/lib/eventos/informe"

// Todos los campos son obligatorios. El colaborador puede registrar tantos
// familiares como necesite, pero cada uno debe ir completo (nombre + parentesco).

export const invitadoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, "Escribe el nombre completo del familiar")
    .max(120, "El nombre es demasiado largo"),
  parentesco: z.string().refine((v) => VALORES_PARENTESCO.includes(v), {
    message: "Selecciona el parentesco",
  }),
})

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
  invitados: z
    .array(invitadoSchema)
    .min(1, "Agrega al menos un familiar invitado")
    .max(MAX_INVITADOS, `Puedes registrar hasta ${MAX_INVITADOS} familiares`),
})

export type InvitadoInput = z.infer<typeof invitadoSchema>
export type RegistroInformeInput = z.infer<typeof registroInformeSchema>

export function invitadoVacio(): InvitadoInput {
  return { nombre: "", parentesco: "" }
}

export const VALORES_INICIALES_INFORME: RegistroInformeInput = {
  colaborador: "",
  area: "",
  invitados: [invitadoVacio()],
}
