import type { Metadata } from "next"
import { Rocket } from "lucide-react"

import { EVENTO_VERANO } from "@/lib/eventos/verano"
import { InscripcionForm } from "@/components/eventos/inscripcion-form"

export const metadata: Metadata = {
  title: "Inscripción — Verano DIFertido 2026",
  description:
    "Formulario de inscripción al curso de verano del DIF Municipal de Chihuahua.",
}

// Página PÚBLICA (sin login). La usan tanto las familias desde su celular como
// el personal que apoya en la captura presencial.
export default function VeranoPublicoPage() {
  return (
    <div className="min-h-screen bg-superficie">
      {/* Encabezado público */}
      <header className="bg-gobierno">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Rocket className="size-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">{EVENTO_VERANO.nombre}</p>
            <p className="text-[11px] text-white/60">{EVENTO_VERANO.sede}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 text-center">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Inscripción al curso de verano
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Llena los datos del niño, niña o adolescente. Al terminar recibirás un
            folio de confirmación.
          </p>
        </div>

        <InscripcionForm />

        <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
          Tus datos se usan únicamente para la organización del curso. DIF Municipal
          de Chihuahua.
        </p>
      </main>
    </div>
  )
}
