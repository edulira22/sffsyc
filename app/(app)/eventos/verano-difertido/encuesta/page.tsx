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
      {/* CSS de impresión: márgenes, colores de fondo */}
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
          className="gap-2 bg-agua hover:bg-agua-600"
          label="Imprimir encuesta"
        />
      </div>

      {/* ── Documento imprimible ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[680px] overflow-hidden rounded-2xl border bg-white shadow-md print:max-w-none print:rounded-none print:border-0 print:shadow-none">

        {/* Encabezado del documento */}
        <div
          className="px-8 py-5 text-white"
          style={{ backgroundColor: "#1A3A6B" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-extrabold tracking-tight">
                🚀 {EVENTO_VERANO.nombre}
              </p>
              <p className="mt-0.5 text-base font-semibold" style={{ color: "#93C5FD" }}>
                Encuesta de cierre — ¡Tu opinión nos importa!
              </p>
            </div>
            <div className="text-right text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <p>{EVENTO_VERANO.sede}</p>
              <p>{fechaMes(EVENTO_VERANO.fin)}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">

          {/* Datos del participante */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                  Mi nombre completo es
                </p>
                <div className="h-7 border-b-2 border-dashed border-gray-300" />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                  Tengo
                </p>
                <div className="flex items-end gap-2">
                  <div className="h-7 w-14 border-b-2 border-dashed border-gray-300" />
                  <span className="mb-0.5 text-sm text-gray-400">años</span>
                </div>
              </div>
            </div>

            {/* Equipo */}
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Mi equipo es
              </p>
              <div className="flex flex-wrap gap-3">
                {GRUPOS_VERANO.map((g) => (
                  <div key={g.id} className="flex items-center gap-1.5">
                    {/* Círculo para marcar */}
                    <span
                      className="inline-flex size-5 shrink-0 rounded-full border-[2.5px]"
                      style={{ borderColor: g.hex }}
                    />
                    <span
                      className="rounded-full px-2.5 py-0.5 text-sm font-bold"
                      style={{
                        backgroundColor: g.hex + "20",
                        color: g.hex,
                      }}
                    >
                      {g.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="mb-6 border-gray-100" />

          {/* ── Pregunta 1 ─────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div
              className="mb-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: "#1A3A6B" }}
            >
              <p className="text-base font-extrabold text-white">
                1. ⭐ ¿Qué fue lo que más te gustó de la veraneada?
              </p>
            </div>
            <div className="space-y-5 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b-2 border-dashed border-gray-200"
                  style={{ height: "24px" }}
                />
              ))}
            </div>
          </div>

          {/* ── Pregunta 2 ─────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div
              className="mb-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: "#2E8B7A" }}
            >
              <p className="text-base font-extrabold text-white">
                2. 🎨 ¿Cuál fue tu clase favorita?
              </p>
              <p className="mt-0.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                Pon una palomita ✓ en el recuadrito de tu clase favorita
              </p>
            </div>

            {clases.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-2 sm:grid-cols-3">
                {clases.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <span
                      className="inline-flex size-5 shrink-0 rounded-[4px] border-2 border-gray-400"
                      style={{ minWidth: "20px" }}
                    />
                    <span className="text-sm text-gray-700">{c.nombre}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Sin clases en BD: cuadrícula en blanco para llenar a mano */
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-2 sm:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="inline-flex size-5 shrink-0 rounded-[4px] border-2 border-gray-400" />
                    <div className="h-4 flex-1 border-b border-dashed border-gray-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Pregunta 3 ─────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div
              className="mb-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: "#7C3AED" }}
            >
              <p className="text-base font-extrabold text-white">
                3. 💡 ¿Qué clase te gustaría aprender el próximo verano?
              </p>
            </div>
            <div className="space-y-5 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b-2 border-dashed border-gray-200"
                  style={{ height: "24px" }}
                />
              ))}
            </div>
          </div>

          {/* Cierre */}
          <div
            className="mt-2 rounded-xl px-5 py-4 text-center"
            style={{
              backgroundColor: "#FEFCE8",
              border: "2px solid #FDE047",
            }}
          >
            <p className="text-base font-extrabold text-yellow-800">
              ¡Gracias por ser parte del Verano DIFertido 2026! 🌟
            </p>
            <p className="mt-0.5 text-sm text-yellow-700">
              Tu opinión nos ayuda a ser mejores cada verano.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
