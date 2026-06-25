"use server"

import { revalidatePath } from "next/cache"
import { Prisma, type EstatusUsuario } from "@prisma/client"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { requerirRol } from "@/lib/session"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  passwordSchema,
  type CrearUsuarioInput,
  type EditarUsuarioInput,
  type PasswordInput,
} from "@/lib/schemas/usuario"

function zonaSegunRol(rol: string, zonaId?: number | null) {
  return rol === "coordinadora_zona" ? zonaId ?? null : null
}

export async function crearUsuario(
  input: CrearUsuarioInput
): Promise<ResultadoAccion> {
  await requerirRol(["admin"])

  const parsed = crearUsuarioSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data

  try {
    await prisma.usuarioSistema.create({
      data: {
        nombre: d.nombre,
        email: d.email,
        passwordHash: await bcrypt.hash(d.password, 12),
        rol: d.rol,
        zonaId: zonaSegunRol(d.rol, d.zonaId),
        areasPermitidas: d.rol === "admin" ? [] : (d.areasPermitidas ?? []),
      },
    })
    revalidatePath("/admin/usuarios")
    return exito("Usuario creado")
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fallo("Ya existe un usuario con ese correo.")
    }
    throw e
  }
}

export async function editarUsuario(
  id: number,
  input: EditarUsuarioInput
): Promise<ResultadoAccion> {
  await requerirRol(["admin"])

  const parsed = editarUsuarioSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos")
  const d = parsed.data

  try {
    await prisma.usuarioSistema.update({
      where: { id },
      data: {
        nombre: d.nombre,
        email: d.email,
        rol: d.rol,
        zonaId: zonaSegunRol(d.rol, d.zonaId),
        areasPermitidas: d.rol === "admin" ? [] : (d.areasPermitidas ?? []),
      },
    })
    revalidatePath("/admin/usuarios")
    return exito("Cambios guardados")
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fallo("Ya existe un usuario con ese correo.")
    }
    throw e
  }
}

export async function cambiarEstatusUsuario(
  id: number,
  estatus: EstatusUsuario
): Promise<ResultadoAccion> {
  const session = await requerirRol(["admin"])

  if (Number(session.user.id) === id && estatus === "inactivo") {
    return fallo("No puedes desactivar tu propia cuenta.")
  }

  await prisma.usuarioSistema.update({ where: { id }, data: { estatus } })
  revalidatePath("/admin/usuarios")
  return exito(estatus === "activo" ? "Usuario activado" : "Usuario desactivado")
}

export async function resetearPassword(
  id: number,
  input: PasswordInput
): Promise<ResultadoAccion> {
  await requerirRol(["admin"])

  const parsed = passwordSchema.safeParse(input)
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Contraseña inválida")

  await prisma.usuarioSistema.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  })
  return exito("Contraseña actualizada")
}
