import type { Metadata } from "next"
import { Rocket } from "lucide-react"

import { EVENTO_VERANO } from "@/lib/eventos/verano"
import { ENCUESTA_PADRES } from "@/lib/eventos/encuesta-padres"
import { EncuestaPadresForm } from "@/components/eventos/encuesta-padres-form"

export const metadata: Metadata = {
  title: "Encuesta de satisfacción — Verano DIFertido 2026",
  description:
    "Cuéntanos tu experiencia del curso de verano del DIF Municipal de Chihuahua.",
}

// Página PÚBLICA (sin login). Los padres/tutores la contestan desde su celular.
export default function EncuestaPadresPage() {
  return (
    <div className="min-h-screen bg-superficie">
      <header className="bg-gobierno">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Rocket className="size-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">{EVENTO_VERANO.nombre}</p>
            <p className="text-[11px] text-white/60">{EVENTO_VERANO.sede}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 text-center">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {ENCUESTA_PADRES.titulo}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu opinión es anónima y toma menos de 5 minutos.
          </p>
        </div>

        <EncuestaPadresForm />

        <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
          Esta encuesta es anónima: no se guarda tu nombre ni ningún dato de
          contacto. DIF Municipal de Chihuahua.
        </p>
      </main>
    </div>
  )
}
