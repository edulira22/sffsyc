"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { UserMenu } from "@/components/layout/user-menu"

export type UsuarioShell = {
  nombre: string
  email: string | null
}

function ContenidoSidebar({
  onNavigate,
  soloProfesor,
  areasVisibles,
  verAdministracion,
}: {
  onNavigate?: () => void
  soloProfesor?: boolean
  areasVisibles: string[]
  verAdministracion: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href={soloProfesor ? "/stem/mis-cursos" : "/dashboard"}
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

      <div className="scroll-oscuro mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3">
        <SidebarNav
          onNavigate={onNavigate}
          soloProfesor={soloProfesor}
          areasVisibles={areasVisibles}
          verAdministracion={verAdministracion}
        />
      </div>

      <div className="px-5 py-4 text-[11px] text-white/40">
        Subdirección de Fortalecimiento Familiar, Social y Comunitario
      </div>
    </div>
  )
}

export function AppShell({
  usuario,
  soloProfesor = false,
  areasVisibles = [],
  verAdministracion = false,
  children,
}: {
  usuario: UsuarioShell
  /** Profesor del Centro STEM: el menú solo muestra "Mis cursos". */
  soloProfesor?: boolean
  /** Secciones que el usuario puede usar (las demás no aparecen en el menú). */
  areasVisibles?: string[]
  /** Permiso de Administración (usuarios, contraseñas, zonas). */
  verAdministracion?: boolean
  children: React.ReactNode
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-gobierno md:flex print:hidden">
        <ContenidoSidebar soloProfesor={soloProfesor} areasVisibles={areasVisibles} verAdministracion={verAdministracion} />
      </aside>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-64 border-0 bg-gobierno p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <ContenidoSidebar
            onNavigate={() => setMenuAbierto(false)}
            soloProfesor={soloProfesor}
            areasVisibles={areasVisibles}
            verAdministracion={verAdministracion}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64 print:pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6 print:hidden">
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
          </div>

          <UserMenu nombre={usuario.nombre} email={usuario.email} />
        </header>

        <main className="min-w-0 flex-1 bg-superficie p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">{children}</main>
      </div>
    </div>
  )
}
