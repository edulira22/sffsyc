"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, MapPin, Menu } from "lucide-react"
import type { RolUsuario } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { UserMenu } from "@/components/layout/user-menu"

export type UsuarioShell = {
  nombre: string
  rol: RolUsuario
  email: string | null
  zonaNombre: string | null
  areasPermitidas: string[]
}

function ContenidoSidebar({
  rol,
  areasPermitidas,
  onNavigate,
}: {
  rol: RolUsuario
  areasPermitidas: string[]
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-5"
      >
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <Building2 className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold text-white">SFFSyC</p>
          <p className="text-[11px] text-white/60">DIF Chihuahua</p>
        </div>
      </Link>

      <div className="mt-2 flex-1 overflow-y-auto px-3">
        <SidebarNav rol={rol} areasPermitidas={areasPermitidas} onNavigate={onNavigate} />
      </div>

      <div className="px-5 py-4 text-[11px] text-white/40">
        Subdirección de Fortalecimiento Familiar, Social y Comunitario
      </div>
    </div>
  )
}

export function AppShell({
  usuario,
  children,
}: {
  usuario: UsuarioShell
  children: React.ReactNode
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-gobierno md:flex">
        <ContenidoSidebar rol={usuario.rol} areasPermitidas={usuario.areasPermitidas} />
      </aside>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-64 border-0 bg-gobierno p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <ContenidoSidebar
            rol={usuario.rol}
            areasPermitidas={usuario.areasPermitidas}
            onNavigate={() => setMenuAbierto(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              <Menu className="size-5" />
            </Button>

            {usuario.rol === "coordinadora_zona" && usuario.zonaNombre && (
              <Badge
                variant="secondary"
                className="gap-1.5 bg-gobierno-50 text-gobierno hover:bg-gobierno-50"
              >
                <MapPin className="size-3.5" />
                Zona {usuario.zonaNombre}
              </Badge>
            )}
          </div>

          <UserMenu nombre={usuario.nombre} rol={usuario.rol} email={usuario.email} />
        </header>

        <main className="flex-1 bg-superficie p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
