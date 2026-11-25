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
  Megaphone,
  Mail,
  Inbox,
  FilePlus2,
  Cpu,
  BarChart3,
  CalendarClock,
  FileBarChart,
  CalendarRange,
  GraduationCap,
  Bot,
  ClipboardCheck,
  Gift,
  PackageOpen,
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

/** Único enlace que ven los profesores del Centro STEM. */
export const NAV_PROFESOR_STEM: ItemSimple = {
  titulo: "Mis cursos",
  href: "/stem/mis-cursos",
  icono: ClipboardCheck,
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
    id: "oficios",
    titulo: "Oficios",
    descripcion: "Bitácora de oficios recibidos, turnado y seguimiento",
    icono: Mail,
    modulos: [
      { titulo: "Bandeja de oficios", href: "/oficios", icono: Inbox },
      { titulo: "Registrar oficios", href: "/oficios/nuevo", icono: FilePlus2 },
    ],
  },
  {
    id: "entregas",
    titulo: "Entregas",
    descripcion: "Solicitudes de apoyos en especie: autorización, aviso y entrega",
    icono: Gift,
    modulos: [{ titulo: "Entregas del año", href: "/entregas", icono: PackageOpen }],
  },
  {
    id: "centro-stem",
    titulo: "Centro STEM",
    descripcion: "Cursos, alumnos y asistencia del Centro STEM San Quintín",
    icono: Cpu,
    modulos: [
      { titulo: "Panel", href: "/stem/panel", icono: BarChart3 },
      { titulo: "Horario", href: "/stem/horario", icono: CalendarClock },
      { titulo: "Cursos", href: "/stem/cursos", icono: CalendarRange },
      { titulo: "Alumnos", href: "/stem/alumnos", icono: Users },
      { titulo: "Clases", href: "/stem/clases", icono: Bot },
      { titulo: "Profesores", href: "/stem/profesores", icono: GraduationCap },
      { titulo: "Reportes", href: "/stem/reportes", icono: FileBarChart },
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
      {
        titulo: "5º Informe DIF Municipal",
        href: "/eventos/informe-karina",
        icono: Megaphone,
      },
    ],
  },
]
