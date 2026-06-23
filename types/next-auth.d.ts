import type { RolUsuario } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      rol: RolUsuario
      zonaId: number | null
      nombre: string
      areasPermitidas: string[]
    } & DefaultSession["user"]
  }

  interface User {
    rol: RolUsuario
    zonaId: number | null
    nombre: string
    areasPermitidas: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    rol: RolUsuario
    zonaId: number | null
    nombre: string
    areasPermitidas: string[]
  }
}
