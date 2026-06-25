import { requerirSesion } from "@/lib/session"
import { AppShell } from "@/components/layout/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requerirSesion()

  return (
    <AppShell
      usuario={{
        nombre: session.user.nombre,
        email: session.user.email ?? null,
        areasPermitidas: session.user.areasPermitidas,
      }}
    >
      {children}
    </AppShell>
  )
}
