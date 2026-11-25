import Link from "@/components/ui/enlace"
import { Lock } from "lucide-react"

import { AREAS } from "@/lib/areas"

export const metadata = { title: "Sin acceso" }

// A donde llegan las páginas y acciones bloqueadas por lib/acceso.ts.
export default function SinAccesoPage({ searchParams }: { searchParams: { seccion?: string; motivo?: string } }) {
  const nombre =
    searchParams.seccion === "administracion"
      ? "Administración"
      : AREAS.find((a) => a.id === searchParams.seccion)?.titulo ?? "esta sección"
  const inactivo = searchParams.motivo === "inactivo"
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-xl border bg-white px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-foreground">{inactivo ? "Tu cuenta está desactivada" : `No tienes acceso a ${nombre}`}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {inactivo
            ? "Pide a quien administra los usuarios que la reactive."
            : "Si lo necesitas para tu trabajo, pide a quien administra los usuarios que te lo habilite."}
        </p>
      </div>
      <Link href="/dashboard" className="text-sm font-medium text-agua hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
