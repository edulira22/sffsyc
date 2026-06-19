import type { RolUsuario } from "@prisma/client"
import type { DefaultSession } from "next-auth"

// Extiende los tipos de NextAuth con los datos institucionales del usuario.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      rol: RolUsuario
      zonaId: number | null
      nombre: string
    } & DefaultSession["user"]
  }

  interface User {
    rol: RolUsuario
    zonaId: number | null
    nombre: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    rol: RolUsuario
    zonaId: number | null
    nombre: string
  }
}
