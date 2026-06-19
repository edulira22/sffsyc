import { requerirSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/app-shell"

// Layout compartido por todas las rutas autenticadas (dashboard, centros,
// beneficiarios, catálogos, administración). Verifica sesión en el servidor.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requerirSesion()

  // La zona solo es relevante para coordinadoras de zona (indicador en header).
  let zonaNombre: string | null = null
  if (session.user.rol === "coordinadora_zona" && session.user.zonaId) {
    const zona = await prisma.zona.findUnique({
      where: { id: session.user.zonaId },
    })
    zonaNombre = zona?.nombre ?? null
  }

  return (
    <AppShell
      usuario={{
        nombre: session.user.nombre,
        rol: session.user.rol,
        email: session.user.email ?? null,
        zonaNombre,
      }}
    >
      {children}
    </AppShell>
  )
}
