import type { NextAuthConfig } from "next-auth"
import type { RolUsuario } from "@prisma/client"

import { areaDeRuta, puedeAccederArea } from "@/lib/areas"

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

      if (!estaLogueado) return false

      // Guard por área: si la ruta pertenece a un área y el usuario no tiene
      // acceso, lo mandamos al inicio. Si no hay datos de áreas (token viejo),
      // puedeAccederArea devuelve true → falla en abierto, nunca bloquea de más.
      const area = areaDeRuta(nextUrl.pathname)
      if (area) {
        const areas = (auth!.user as { areasPermitidas?: string[] }).areasPermitidas
        if (!puedeAccederArea(areas, area)) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.nombre = user.nombre
        token.rol = user.rol
        token.zonaId = user.zonaId
        token.areasPermitidas = user.areasPermitidas ?? []
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.nombre = token.nombre as string
        session.user.rol = token.rol as RolUsuario
        session.user.zonaId = (token.zonaId as number | null) ?? null
        session.user.areasPermitidas = (token.areasPermitidas as string[]) ?? []
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
