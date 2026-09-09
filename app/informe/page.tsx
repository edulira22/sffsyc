import type { Metadata } from "next"

import { EVENTO_INFORME } from "@/lib/eventos/informe"
import { InformeForm } from "@/components/eventos/informe-form"

export const metadata: Metadata = {
  title: EVENTO_INFORME.titulo,
  description: EVENTO_INFORME.descripcion,
}

function fechaLarga(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Página PÚBLICA (sin login). La llenan los colaboradores desde su celular o
// el personal de apoyo desde una laptop.
export default function InformePublicoPage() {
  const detalles = [
    EVENTO_INFORME.fecha ? fechaLarga(EVENTO_INFORME.fecha) : null,
    EVENTO_INFORME.sede,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-superficie">
      {/* Franja institucional */}
      <header className="border-b border-gobierno/15 bg-gobierno">
        <div className="mx-auto max-w-xl px-5 py-4 sm:px-6">
          <p className="text-[13px] font-semibold tracking-tight text-white">
            {EVENTO_INFORME.institucion}
          </p>
          <p className="mt-0.5 text-[11px] text-white/55">
            Subdirección de Fortalecimiento Familiar, Social y Comunitario
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-8 sm:px-6 sm:py-10">
        {/* Título y descripción */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {EVENTO_INFORME.titulo}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {EVENTO_INFORME.descripcion}
          </p>
          {detalles.length > 0 && (
            <p className="mt-3 text-sm font-medium text-gobierno">
              {detalles.join(" · ")}
            </p>
          )}
        </div>

        <InformeForm />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Los datos se utilizan únicamente para la organización y el control de
          acceso del evento.
        </p>
      </main>
    </div>
  )
}
