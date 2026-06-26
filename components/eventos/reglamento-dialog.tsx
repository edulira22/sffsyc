"use client"

import { useState } from "react"
import { BookOpen, ScrollText } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { EVENTO_VERANO, REGLAMENTO_VERANO } from "@/lib/eventos/verano"

// Link estético que abre el reglamento completo en una ventana, sin saturar
// el formulario con todo el texto.
export function ReglamentoDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 font-medium text-gobierno underline decoration-gobierno/30 underline-offset-2 transition-colors hover:text-gobierno-600 hover:decoration-gobierno"
      >
        <BookOpen className="size-3.5" />
        Ver reglamento
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-gobierno px-6 py-4 text-left">
            <DialogTitle className="flex items-center gap-2 text-white">
              <ScrollText className="size-5" />
              Reglamento — {EVENTO_VERANO.nombre}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Léelo con atención antes de aceptar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 overflow-y-auto px-6 py-5 text-sm text-foreground">
            <ol className="list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-gobierno">
              {REGLAMENTO_VERANO.reglas.map((r, i) => (
                <li key={i} className="leading-relaxed">
                  {r}
                </li>
              ))}
            </ol>

            <section>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gobierno">
                Hora de entrada y salida
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {REGLAMENTO_VERANO.entradaSalida.map((t, i) => (
                  <li key={i} className="leading-relaxed">
                    {t}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gobierno">
                Grupo de WhatsApp por equipo
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {REGLAMENTO_VERANO.whatsapp}
              </p>
            </section>

            <p className="rounded-lg border border-gobierno/15 bg-gobierno-50 px-4 py-3 text-sm font-medium text-gobierno">
              {REGLAMENTO_VERANO.cierre}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
