import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"

const credencialesSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credencialesSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const usuario = await prisma.usuarioSistema.findUnique({
          where: { email: email.toLowerCase().trim() },
        })

        // Usuario inexistente o dado de baja: acceso denegado.
        if (!usuario || usuario.estatus !== "activo") return null

        const passwordValida = await bcrypt.compare(password, usuario.passwordHash)
        if (!passwordValida) return null

        return {
          id: String(usuario.id),
          email: usuario.email,
          nombre: usuario.nombre,
          name: usuario.nombre,
          rol: usuario.rol,
          zonaId: usuario.zonaId,
          areasPermitidas: usuario.areasPermitidas,
        }
      },
    }),
  ],
})
