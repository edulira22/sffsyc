import Link from "next/link"
import { MapPin, UserCog, GraduationCap } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { TIPO_CENTRO_LABEL } from "@/lib/schemas/centro"
import type { CentroTarjeta } from "@/lib/data/centros"

export function CentroCard({ centro }: { centro: CentroTarjeta }) {
  const coordinadora = centro.coordinadora
    ? `${centro.coordinadora.nombre} ${centro.coordinadora.apellidoPaterno}`
    : "Sin coordinadora"

  return (
    <Link href={`/centros/${centro.id}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground group-hover:text-agua-700">
                {centro.nombre}
              </h3>
              <Badge variant="secondary" className="mt-1 text-xs">
                {TIPO_CENTRO_LABEL[centro.tipo]}
              </Badge>
            </div>
            <StatusBadge estatus={centro.estatus} />
          </div>

          <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              Zona {centro.zona.nombre}
            </p>
            <p className="flex items-center gap-2">
              <UserCog className="size-4 shrink-0" />
              <span className="truncate">{coordinadora}</span>
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap className="size-4 shrink-0" />
              {centro.clasesCentro.length}{" "}
              {centro.clasesCentro.length === 1
                ? "clase activa"
                : "clases activas"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
