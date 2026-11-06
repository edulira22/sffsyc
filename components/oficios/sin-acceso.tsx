import Link from "next/link"
import { Lock } from "lucide-react"

/** Aviso para quien no tiene la sección Oficios en su acceso. */
export function SinAccesoOficios() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-white px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-foreground">No tienes acceso a Oficios</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Si lo necesitas, pide a la persona que administra los usuarios que te dé acceso a esta sección.
        </p>
      </div>
      <Link href="/dashboard" className="text-sm font-medium text-agua hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
