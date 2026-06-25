import { redirect } from "next/navigation"
import { auth } from "@/auth"

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

/** Alias de requerirSesion — roles ignorados, solo verifica sesión activa. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requerirRol(..._args: unknown[]) {
  return requerirSesion()
}
