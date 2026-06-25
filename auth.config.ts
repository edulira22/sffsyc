import type { NextAuthConfig } from "next-auth"
import type { RolUsuario } from "@prisma/client"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const estaLogueado = !!auth?.user
      const enLogin = nextUrl.pathname.startsWith("/login")

      if (enLogin) {
        if (estaLogueado) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      return estaLogueado
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.rol = user.rol
        token.zonaId = user.zonaId
        token.nombre = user.nombre
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.rol = token.rol as RolUsuario
        session.user.zonaId = (token.zonaId as number | null) ?? null
        session.user.nombre = token.nombre as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
