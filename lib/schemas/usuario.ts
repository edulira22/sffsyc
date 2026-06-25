import { z } from "zod"

export const ROLES_USUARIO = [
  "admin",
  "coordinacion_general",
  "coordinadora_zona",
  "oficina",
] as const

const campos = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().toLowerCase().email("Correo no válido"),
  rol: z.enum(ROLES_USUARIO, { message: "Selecciona un rol" }),
  zonaId: z.number().int().positive().nullable().optional(),
  areasPermitidas: z.array(z.string()).default([]),

})

const MENSAJE_ZONA = "La coordinadora de zona requiere una zona asignada"

export const editarUsuarioSchema = campos.refine(
  (d) => d.rol !== "coordinadora_zona" || d.zonaId != null,
  { message: MENSAJE_ZONA, path: ["zonaId"] }
)

export const crearUsuarioSchema = campos
  .extend({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((d) => d.rol !== "coordinadora_zona" || d.zonaId != null, {
    message: MENSAJE_ZONA,
    path: ["zonaId"],
  })

export const passwordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
