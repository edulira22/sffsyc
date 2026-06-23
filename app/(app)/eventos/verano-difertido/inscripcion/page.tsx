import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { InscripcionForm } from "@/components/eventos/inscripcion-form"

export const metadata = { title: "Inscripción — Verano DIFertido 2026" }

export default async function InscripcionVeranoPage() {
  await requerirSesion()
  return (
    <div className="space-y-4">
      <Link
        href="/eventos/verano-difertido"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Verano DIFertido 2026
      </Link>
      <InscripcionForm />
    </div>
  )
}
