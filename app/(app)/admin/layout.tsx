import { requerirAdminSistema } from "@/lib/acceso"

// Administración (usuarios, contraseñas, zonas): solo con el permiso explícito.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requerirAdminSistema()
  return <>{children}</>
}
