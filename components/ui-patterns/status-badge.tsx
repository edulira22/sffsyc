import { cn } from "@/lib/utils"

// Badge de estatus reutilizable en todo el sistema (catálogos, centros,
// beneficiarios, inscripciones). Mapea cada estatus a un color con significado.
const ESTILOS: Record<string, string> = {
  activo: "bg-agua-50 text-agua-700 ring-agua/20",
  activa: "bg-agua-50 text-agua-700 ring-agua/20",
  inactivo: "bg-muted text-muted-foreground ring-border",
  inactiva: "bg-muted text-muted-foreground ring-border",
  baja: "bg-red-50 text-red-700 ring-red-200",
  pendiente: "bg-amber-50 text-amber-700 ring-amber-200",
}

export function StatusBadge({ estatus }: { estatus: string }) {
  const estilo = ESTILOS[estatus] ?? ESTILOS.inactivo
  const label = estatus.charAt(0).toUpperCase() + estatus.slice(1)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        estilo
      )}
    >
      {label}
    </span>
  )
}
