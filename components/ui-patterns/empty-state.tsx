import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Estado vacío útil: ícono, mensaje y acción sugerida (nunca una pantalla en blanco).
export function EmptyState({
  icono: Icono,
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono: LucideIcon
  titulo: string
  descripcion?: string
  accion?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-white px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icono className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
      {descripcion && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}
