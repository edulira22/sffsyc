"use client"

import { useEffect, useState } from "react"

// Cuenta regresiva del evento. Antes del inicio cuenta hacia el arranque;
// durante el curso cuenta hacia el cierre; después, muestra "finalizado".

type Fase = "antes" | "encurso" | "finalizado"

function diff(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime())
  const dias = Math.floor(ms / 86_400_000)
  const horas = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutos = Math.floor((ms % 3_600_000) / 60_000)
  const segundos = Math.floor((ms % 60_000) / 1000)
  return { dias, horas, minutos, segundos }
}

export function CuentaRegresiva({
  inicioISO,
  finISO,
}: {
  inicioISO: string
  finISO: string
}) {
  // El inicio cuenta a las 08:00; el fin al cierre del día.
  const inicio = new Date(`${inicioISO}T08:00:00`)
  const fin = new Date(`${finISO}T23:59:59`)

  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Evita el desajuste de hidratación: render neutro hasta montar en cliente.
  if (!now) {
    return (
      <div className="h-[92px] animate-pulse rounded-xl border border-white/20 bg-white/10" />
    )
  }

  let fase: Fase
  let objetivo: Date
  if (now < inicio) {
    fase = "antes"
    objetivo = inicio
  } else if (now <= fin) {
    fase = "encurso"
    objetivo = fin
  } else {
    fase = "finalizado"
    objetivo = fin
  }

  const t = diff(objetivo, now)

  if (fase === "finalizado") {
    return (
      <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-center">
        <p className="text-sm font-medium text-white/90">
          El curso de verano ha finalizado. ¡Gracias por participar!
        </p>
      </div>
    )
  }

  const etiqueta =
    fase === "antes"
      ? "Faltan para el arranque"
      : "El curso está en marcha — cierre en"

  const celdas = [
    { v: t.dias, l: "días" },
    { v: t.horas, l: "horas" },
    { v: t.minutos, l: "min" },
    { v: t.segundos, l: "seg" },
  ]

  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-white/70">
        {etiqueta}
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {celdas.map((c, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-[58px] rounded-lg bg-white/15 px-2 py-1.5 text-center">
              <p className="text-2xl font-bold tabular-nums text-white">
                {String(c.v).padStart(2, "0")}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                {c.l}
              </p>
            </div>
            {i < celdas.length - 1 && (
              <span className="text-xl font-bold text-white/40">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
