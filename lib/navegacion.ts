import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  BookMarked,
  ShieldCheck,
  FileSpreadsheet,
  Wrench,
  CalendarDays,
  ClipboardList,
  Rocket,
  type LucideIcon,
} from "lucide-react"

// =============================================================================
//  Navegación (presentación del sidebar).
//  El CONTROL DE ACCESO por área vive en lib/areas.ts — aquí solo definimos
//  cómo se ve cada área: su icono y sus submódulos (enlaces).
//  El `id` de cada área debe coincidir con el de lib/areas.ts.
// =============================================================================

export type ModuloNav = {
  titulo: string
  href: string
  icono: LucideIcon
}

export type AreaNav = {
  id: string
  titulo: string
  descripcion: string
  icono: LucideIcon
  proximamente?: boolean
  modulos: ModuloNav[]
}

export type ItemSimple = {
  titulo: string
  href: string
  icono: LucideIcon
}

// Entradas globales (fuera de cualquier área).
export const NAV_INICIO: ItemSimple = {
  titulo: "Inicio",
  href: "/dashboard",
  icono: LayoutDashboard,
}

export const NAV_ADMINISTRACION: ItemSimple = {
  titulo: "Administración",
  href: "/admin",
  icono: ShieldCheck,
}

// Áreas de la plataforma (ids alineados con lib/areas.ts).
export const NAV_AREAS: AreaNav[] = [
  {
    id: "centros-comunitarios",
    titulo: "Centros Comunitarios",
    descripcion: "Centros, beneficiarios, clases y coordinación",
    icono: Building2,
    modulos: [
      { titulo: "Captura mensual", href: "/captura-mensual", icono: ClipboardList },
      { titulo: "Centros", href: "/centros", icono: MapPin },
      { titulo: "Beneficiarios", href: "/beneficiarios", icono: Users },
      { titulo: "Catálogos", href: "/catalogos", icono: BookMarked },
      { titulo: "Importar / Exportar", href: "/datos", icono: FileSpreadsheet },
    ],
  },
  {
    id: "mantenimiento",
    titulo: "Mantenimiento",
    descripcion: "Bitácoras, solicitudes y seguimiento de mantenimiento",
    icono: Wrench,
    proximamente: true,
    modulos: [],
  },
  {
    id: "eventos",
    titulo: "Eventos",
    descripcion: "Programación y seguimiento de eventos institucionales",
    icono: CalendarDays,
    modulos: [
      {
        titulo: "Verano DIFertido 2026",
        href: "/eventos/verano-difertido",
        icono: Rocket,
      },
    ],
  },
]
