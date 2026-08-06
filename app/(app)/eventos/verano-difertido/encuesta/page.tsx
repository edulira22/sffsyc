import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { EVENTO_VERANO, GRUPOS_VERANO } from "@/lib/eventos/verano"
import { BotonImprimir } from "@/components/eventos/boton-imprimir"

export const metadata = { title: "Encuesta de cierre — Verano DIFertido 2026" }

function fechaMes(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  })
}

const CLASES_ENCUESTA = [
  { id: "robotica",  nombre: "Robótica",  sub: "STEM" },
  { id: "danza",     nombre: "Danza",     sub: null },
  { id: "capoeira",  nombre: "Capoeira",  sub: null },
  { id: "arte",      nombre: "Arte",      sub: null },
  { id: "futbol",    nombre: "Fútbol",    sub: null },
  { id: "natacion",  nombre: "Natación",  sub: null },
]

export default async function EncuestaVeranoPage() {
  await requerirSesion()

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

        {/* Encabezado */}
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

        <div className="px-7 py-6">

          {/* Equipo */}
          <div>
            <p className="mb-2 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-gray-400">
              Mi equipo es
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2.5">
              {GRUPOS_VERANO.map((g) => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className="inline-block size-5 shrink-0 rounded-full border-2 border-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">{g.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ── Pregunta 1 ─────────────────────────────────────────────────── */}
          <div className="mb-7">
            <div className="mb-4 border-l-4 border-gray-900 pl-3">
              <p className="text-[14px] font-extrabold leading-snug text-gray-900">
                1. ⭐ ¿Qué fue lo que más te gustó de la veraneada?
              </p>
            </div>
            <div className="flex flex-col gap-6 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 border-b-2 border-dashed border-gray-300" />
              ))}
            </div>
          </div>

          {/* ── Pregunta 2 ─────────────────────────────────────────────────── */}
          <div className="mb-7">
            <div className="mb-4 border-l-4 border-gray-900 pl-3">
              <p className="text-[14px] font-extrabold leading-snug text-gray-900">
                2. 🎨 ¿Cuál fue tu clase favorita?
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Pon una palomita ✓ en el recuadrito de tu clase favorita
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-1">
              {CLASES_ENCUESTA.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="inline-flex size-6 shrink-0 rounded border-2 border-gray-500" />
                  <div>
                    <p className="text-[14px] font-semibold text-gray-800">{c.nombre}</p>
                    {c.sub && <p className="text-[11px] text-gray-400">{c.sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pregunta 3 ─────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div className="mb-4 border-l-4 border-gray-900 pl-3">
              <p className="text-[14px] font-extrabold leading-snug text-gray-900">
                3. 💡 ¿Qué clase te gustaría aprender el próximo verano?
              </p>
            </div>
            <div className="flex flex-col gap-6 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 border-b-2 border-dashed border-gray-300" />
              ))}
            </div>
          </div>

          {/* Cierre */}
          <div className="rounded-lg border border-gray-400 px-4 py-3 text-center">
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
