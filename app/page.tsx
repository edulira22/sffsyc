import { redirect } from "next/navigation"

// La raíz siempre lleva al dashboard. Si no hay sesión, el middleware
// intercepta y redirige a /login.
export default function Home() {
  redirect("/dashboard")
}
