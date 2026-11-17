import { requerirSesion } from "@/lib/session"
import { accesoDe } from "@/lib/acceso"
import { AppShell } from "@/components/layout/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requerirSesion()
  const acceso = await accesoDe(session)

  return (
    <AppShell
      usuario={{
        nombre: session.user.nombre,
        email: session.user.email ?? null,
      }}
      soloProfesor={session.user.rol === "profesor_stem"}
      areasVisibles={acceso.areas}
      verAdministracion={acceso.esAdminSistema}
    >
      {children}
    </AppShell>
  )
}
