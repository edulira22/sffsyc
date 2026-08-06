import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { EVENTO_VERANO, GRUPOS_VERANO } from "@/lib/eventos/verano"
import { BotonImprimir } from "@/components/eventos/boton-imprimir"

export const metadata = { title: "Encuesta de cierre — Verano DIFertido 2026" }

function fechaMes(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  })
}

export default async function EncuestaVeranoPage() {
  await requerirSesion()

  const clases = await prisma.claseVerano.findMany({
    where: { estatus: "activa" },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  })

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 2cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Barra de herramientas — solo en pantalla */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link
            href="/eventos/verano-difertido"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Verano DIFertido 2026
          </Link>
          <h1 className="mt-1 text-xl font-bold">Encuesta de cierre</h1>
          <p className="text-sm text-muted-foreground">
            Imprime una copia por participante y entrega al finalizar el curso.
          </p>
        </div>
        <BotonImprimir
          className="gap-2 bg-gobierno hover:bg-gobierno/90"
          label="Imprimir encuesta"
        />
      </div>

      {/* ── Documento imprimible ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[620px] overflow-hidden rounded-xl border bg-white shadow-md print:max-w-none print:rounded-none print:border-0 print:shadow-none">

        {/* Encabezado — sin fondo, solo borde inferior grueso */}
        <div className="flex items-start justify-between gap-3 border-b-[3px] border-gray-900 px-7 py-4">
          <div>
            <p className="text-[18px] font-black tracking-tight text-gray-900">
              🚀 {EVENTO_VERANO.nombre}
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500">
              Encuesta de cierre — ¡Tu opinión nos importa!
            </p>
          </div>
          <div className="shrink-0 text-right text-[10px] leading-relaxed text-gray-400">
            <p>{EVENTO_VERANO.sede}</p>
            <p>{fechaMes(EVENTO_VERANO.fin)}</p>
          </div>
        </div>

        <div className="px-7 py-5">

          {/* Equipo */}
          <div>
            <p className="mb-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-gray-400">
              Mi equipo es
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {GRUPOS_VERANO.map((g) => (
                <div key={g.id} className="flex items-center gap-1.5">
                  <span className="inline-block size-4 shrink-0 rounded-full border-2 border-gray-500" />
                  <span className="text-[12.5px] font-semibold text-gray-800">{g.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* ── Pregunta 1 ─────────────────────────────────────────────────── */}
          <div className="mb-4">
            {/* Borde izquierdo grueso como señal visual, sin fondo */}
            <div className="mb-3 border-l-4 border-gray-900 pl-3">
              <p className="text-[13px] font-extrabold leading-snug text-gray-900">
                1. ⭐ ¿Qué fue lo que más te gustó de la veraneada?
              </p>
            </div>
            <div className="flex flex-col gap-4 px-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 border-b-2 border-dashed border-gray-300" />
              ))}
            </div>
          </div>

          {/* ── Pregunta 2 ─────────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="mb-3 border-l-4 border-gray-900 pl-3">
              <p className="text-[13px] font-extrabold leading-snug text-gray-900">
                2. 🎨 ¿Cuál fue tu clase favorita?
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                Pon una palomita ✓ en el recuadrito de tu clase favorita
              </p>
            </div>

            {clases.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-5 gap-y-2.5 px-0.5">
                {clases.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="inline-flex size-4 shrink-0 rounded-[3px] border-2 border-gray-500" />
                    <span className="text-[12.5px] font-semibold text-gray-800">{c.nombre}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-x-5 gap-y-2.5 px-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="inline-flex size-4 shrink-0 rounded-[3px] border-2 border-gray-500" />
                    <div className="h-4 flex-1 border-b border-dashed border-gray-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Pregunta 3 ─────────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="mb-3 border-l-4 border-gray-900 pl-3">
              <p className="text-[13px] font-extrabold leading-snug text-gray-900">
                3. 💡 ¿Qué clase te gustaría aprender el próximo verano?
              </p>
            </div>
            <div className="flex flex-col gap-4 px-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 border-b-2 border-dashed border-gray-300" />
              ))}
            </div>
          </div>

          {/* Cierre — borde delgado, sin fondo */}
          <div className="mt-1 rounded-lg border border-gray-400 px-4 py-3 text-center">
            <p className="text-[13px] font-extrabold text-gray-900">
              ¡Gracias por ser parte del Verano DIFertido 2026! 🌟
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Tu opinión nos ayuda a ser mejores cada verano.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
