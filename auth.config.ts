import type { NextAuthConfig } from "next-auth"
import type { RolUsuario } from "@prisma/client"

// Configuración "edge-safe" de NextAuth: sin Prisma ni bcrypt, para que pueda
// ejecutarse dentro del middleware de Next.js. El provider de credenciales
// (que sí usa Prisma) se añade aparte en auth.ts.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Controla el acceso a las rutas desde el middleware.
    authorized({ auth, request: { nextUrl } }) {
      const estaLogueado = !!auth?.user
      const enLogin = nextUrl.pathname.startsWith("/login")

      if (enLogin) {
        // Si ya inició sesión, no tiene caso ver el login.
        if (estaLogueado) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      // Cualquier otra ruta requiere sesión iniciada.
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
  providers: [], // se completan en auth.ts
} satisfies NextAuthConfig
