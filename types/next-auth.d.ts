import type { RolUsuario } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      nombre: string
      rol: RolUsuario
      zonaId: number | null
    } & DefaultSession["user"]
  }

  interface User {
    nombre: string
    rol: RolUsuario
    zonaId: number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    nombre: string
    rol: RolUsuario
    zonaId: number | null
  }
}
