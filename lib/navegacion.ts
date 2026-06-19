import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  BookMarked,
  ShieldCheck,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react"
import type { RolUsuario } from "@prisma/client"
import { puedeGestionarCatalogos, puedeAdministrar } from "@/lib/permisos"

// =============================================================================
//  Navegación de la PLATAFORMA de la Subdirección (SFFSyC).
//  La plataforma alberga varias ÁREAS. "Centros Comunitarios" es la primera;
//  con el tiempo se sumarán otras. Cada área agrupa sus propios módulos y solo
//  se muestra a quien tiene acceso a ella. Así, un usuario ajeno a un área no
//  ve sus módulos y el menú queda claro y separado.
// =============================================================================

export type ModuloNav = {
  titulo: string
  href: string
  icono: LucideIcon
  visible?: (rol: RolUsuario) => boolean
}

export type AreaNav = {
  id: string
  titulo: string
  icono: LucideIcon
  // Acceso al área completa. Hoy depende del rol; cuando existan más áreas
  // pasará a depender de los permisos de área del usuario.
  visible: (rol: RolUsuario) => boolean
  modulos: ModuloNav[]
}

export type ItemSimple = {
  titulo: string
  href: string
  icono: LucideIcon
  visible: (rol: RolUsuario) => boolean
}

// Entradas globales de la plataforma (fuera de cualquier área).
export const NAV_INICIO: ItemSimple = {
  titulo: "Inicio",
  href: "/dashboard",
  icono: LayoutDashboard,
  visible: () => true,
}

export const NAV_ADMINISTRACION: ItemSimple = {
  titulo: "Administración",
  href: "/admin",
  icono: ShieldCheck,
  visible: puedeAdministrar,
}

// Áreas de la plataforma. (Por ahora solo Centros Comunitarios.)
export const NAV_AREAS: AreaNav[] = [
  {
    id: "centros-comunitarios",
    titulo: "Centros Comunitarios",
    icono: Building2,
    visible: () => true,
    modulos: [
      { titulo: "Centros", href: "/centros", icono: MapPin },
      { titulo: "Beneficiarios", href: "/beneficiarios", icono: Users },
      {
        titulo: "Catálogos",
        href: "/catalogos",
        icono: BookMarked,
        visible: puedeGestionarCatalogos,
      },
      {
        titulo: "Importar / Exportar",
        href: "/datos",
        icono: FileSpreadsheet,
        visible: puedeGestionarCatalogos,
      },
    ],
  },
]
