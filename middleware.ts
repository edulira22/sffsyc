import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// El middleware usa solo la config edge-safe (sin Prisma).
// La lógica de acceso vive en el callback `authorized` de authConfig.
export default NextAuth(authConfig).auth

export const config = {
  // Protege todo excepto: rutas de API, assets de Next, y archivos estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
