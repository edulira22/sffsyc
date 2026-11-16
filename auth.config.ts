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

      // Rutas públicas (sin sesión): inscripción al curso de verano y
      // registro de asistencia y acomodo del staff del 5º Informe DIF Municipal.
      const esPublica =
        nextUrl.pathname.startsWith("/verano") ||
        nextUrl.pathname.startsWith("/informe")
      if (esPublica) return true

      // Los profesores del Centro STEM solo usan "Mis cursos": cualquier otra
      // ruta (incluido /login ya con sesión) los regresa ahí.
      if (estaLogueado && auth.user.rol === "profesor_stem") {
        if (nextUrl.pathname.startsWith("/stem/mis-cursos")) return true
        return Response.redirect(new URL("/stem/mis-cursos", nextUrl))
      }

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
        token.nombre = user.nombre
        token.rol = user.rol
        token.zonaId = user.zonaId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.nombre = token.nombre as string
        session.user.rol = token.rol as RolUsuario
        session.user.zonaId = (token.zonaId as number | null) ?? null
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
