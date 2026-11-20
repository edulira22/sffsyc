import { requerirArea } from "@/lib/acceso"

// Solo quien tiene la sección marcada en su acceso (se revisa en el servidor).
export default async function EntregasLayout({ children }: { children: React.ReactNode }) {
  await requerirArea("entregas")
  return <>{children}</>
}
