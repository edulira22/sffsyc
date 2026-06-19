import { cn } from "@/lib/utils"

// Encabezado de página consistente: título, descripción opcional y acciones.
export function PageHeader({
  titulo,
  descripcion,
  acciones,
  className,
}: {
  titulo: string
  descripcion?: string
  acciones?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
        )}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </div>
  )
}
