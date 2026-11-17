import { requerirArea } from "@/lib/acceso"

// Solo quien tiene la sección marcada en su acceso (se revisa en el servidor).
export default async function SeccionLayout({ children }: { children: React.ReactNode }) {
  await requerirArea("eventos")
  return <>{children}</>
}
