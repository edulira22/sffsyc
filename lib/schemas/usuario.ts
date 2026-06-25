import { z } from "zod"

const campos = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().toLowerCase().email("Correo no válido"),
  // Áreas a las que puede entrar. Lista vacía = acceso a todo (uso interno).
  areasPermitidas: z.array(z.string()).default([]),
})

export const editarUsuarioSchema = campos

export const crearUsuarioSchema = campos.extend({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export const passwordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
