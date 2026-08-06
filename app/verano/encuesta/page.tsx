import type { Metadata } from "next"
import { Rocket, Sun } from "lucide-react"

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
      {/* Encabezado del evento */}
      <header className="relative overflow-hidden bg-gradient-to-br from-gobierno via-gobierno to-purple-900">
        {/* Destellos de verano — decorativos, puramente CSS */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-amber-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 size-52 rounded-full bg-agua/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Rocket className="size-5 text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-white">
                DIF Municipal de Chihuahua
              </p>
              <p className="text-[11px] text-white/55">
                Subdirección de Fortalecimiento Familiar, Social y Comunitario
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/25">
            <Sun className="size-3" />
            {EVENTO_VERANO.nombre}
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {ENCUESTA_PADRES.titulo}
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-white/70">
            Tu opinión construye la veraneada del próximo año. Toma menos de 5
            minutos y puedes responder de forma anónima.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <EncuestaPadresForm />

        <div className="mx-auto mt-8 max-w-md text-center">
          <p className="text-xs text-muted-foreground">
            Responder es voluntario. Si no escribes tu nombre, la respuesta queda
            totalmente anónima y no se guarda ningún dato de contacto.
          </p>
          <p className="mt-3 text-[11px] font-medium text-gobierno">
            DIF Municipal de Chihuahua · {EVENTO_VERANO.sede}
          </p>
        </div>
      </main>
    </div>
  )
}
