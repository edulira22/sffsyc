"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck, Clock, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"

// Aviso de la temporada de inscripciones (lunes a viernes):
//  - antes: cuánto falta para que ABRAN.
//  - durante: inscripciones abiertas + cuánto falta para que CIERREN.
//  - después: no se muestra nada (el aviso se quita solo).

type Fase = "antes" | "abierto" | "cerrado"

function diff(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime())
  return {
    dias: Math.floor(ms / 86_400_000),
    horas: Math.floor((ms % 86_400_000) / 3_600_000),
    minutos: Math.floor((ms % 3_600_000) / 60_000),
    segundos: Math.floor((ms % 60_000) / 1000),
  }
}

export function PeriodoInscripcion({
  inicioISO,
  finISO,
}: {
  inicioISO: string
  finISO: string
}) {
  // Abre el lunes a las 08:00; cierra al final del viernes.
  const inicio = new Date(`${inicioISO}T08:00:00`)
  const fin = new Date(`${finISO}T23:59:59`)

  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Sin render hasta montar en cliente (evita desajuste de hidratación).
  if (!now) return null

  let fase: Fase
  if (now < inicio) fase = "antes"
  else if (now <= fin) fase = "abierto"
  else fase = "cerrado"

  // Terminó la temporada: el aviso desaparece.
  if (fase === "cerrado") return null

  const abierto = fase === "abierto"
  const objetivo = abierto ? fin : inicio
  const t = diff(objetivo, now)

  const celdas = [
    { v: t.dias, l: "días" },
    { v: t.horas, l: "h" },
    { v: t.minutos, l: "min" },
    { v: t.segundos, l: "seg" },
  ]

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
        abierto
          ? "border-agua/30 bg-agua-50"
          : "border-amber-200 bg-amber-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            abierto ? "bg-agua text-white" : "bg-amber-400 text-white"
          )}
        >
          {abierto ? (
            <CalendarCheck className="size-6" />
          ) : (
            <Clock className="size-6" />
          )}
        </div>
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              abierto ? "text-agua-700" : "text-amber-700"
            )}
          >
            {abierto ? "Inscripciones abiertas" : "Temporada de inscripciones"}
          </p>
          <p className="text-sm font-medium text-foreground">
            {abierto
              ? "Cierran en"
              : "Abren el lunes. Faltan"}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            {celdas.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="min-w-[44px] rounded-lg bg-white px-2 py-1 text-center shadow-sm">
                  <span className="block text-lg font-bold tabular-nums text-foreground">
                    {String(c.v).padStart(2, "0")}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">
                    {c.l}
                  </span>
                </div>
                {i < celdas.length - 1 && (
                  <span className="text-sm font-bold text-muted-foreground/40">:</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {abierto && (
        <Link
          href="/verano"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-agua px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-agua-600"
        >
          <ExternalLink className="size-4" />
          Abrir formulario
        </Link>
      )}
    </div>
  )
}
