import { redirect } from "next/navigation"
import type { RolUsuario } from "@prisma/client"
import { auth } from "@/auth"

// Helpers de sesión para Server Components y Route Handlers.
// Siempre verifican en el servidor; nunca confían solo en la UI.

/** Devuelve la sesión actual (o null). */
export async function obtenerSesion() {
  return auth()
}

/** Exige sesión iniciada; si no, redirige a /login. */
export async function requerirSesion() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

/** Exige sesión iniciada y uno de los roles dados; si no, redirige al dashboard. */
export async function requerirRol(rolesPermitidos: RolUsuario[]) {
  const session = await requerirSesion()
  if (!rolesPermitidos.includes(session.user.rol)) {
    redirect("/dashboard")
  }
  return session
}
