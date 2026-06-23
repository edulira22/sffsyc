"use client"

import { useState, useTransition } from "react"
import { CalendarDays, ChevronRight, RefreshCw } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RegistradorMasivo, type ClaseOpcion } from "@/components/centros/registrador-masivo"
import { obtenerClasesCentro } from "@/app/(app)/captura-mensual/actions"

// ---- Constantes de mes/año --------------------------------------------------

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const hoy = new Date()
const MES_ACTUAL = hoy.getMonth() + 1   // 1–12
const AÑO_ACTUAL = hoy.getFullYear()

type CentroItem = {
  id: number
  nombre: string
  zona: { nombre: string }
}

type CapturaActiva = {
  centroId: number
  centroNombre: string
  mes: number
  año: number
  clases: ClaseOpcion[]
}

// ---- Componente principal ---------------------------------------------------

export function CapturaZonaMensual({ centros }: { centros: CentroItem[] }) {
  const [centroId, setCentroId] = useState<string>("")
  const [mes, setMes] = useState<string>(String(MES_ACTUAL))
  const [año, setAño] = useState<string>(String(AÑO_ACTUAL))
  const [captura, setCaptura] = useState<CapturaActiva | null>(null)
  const [pending, startTransition] = useTransition()

  function iniciarCaptura() {
    const id = Number(centroId)
    const m = Number(mes)
    const a = Number(año)
    if (!id || !m || !a) return

    startTransition(async () => {
      const clases = await obtenerClasesCentro(id)
      const centro = centros.find((c) => c.id === id)
      setCaptura({
        centroId: id,
        centroNombre: centro?.nombre ?? "",
        mes: m,
        año: a,
        clases,
      })
    })
  }

  // Período como "YYYY-MM-01" para la inscripción
  const periodoFecha = captura
    ? `${captura.año}-${String(captura.mes).padStart(2, "0")}-01`
    : undefined

  // Agrupar centros por zona para el select
  const zonas = Array.from(new Set(centros.map((c) => c.zona.nombre))).sort()

  return (
    <div className="space-y-5">
      {/* Panel de selección */}
      {!captura ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Selecciona el centro y el periodo a capturar
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Centro */}
            <div className="sm:col-span-3 md:col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Centro comunitario
              </label>
              <Select value={centroId} onValueChange={setCentroId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un centro…" />
                </SelectTrigger>
                <SelectContent>
                  {zonas.map((zona) => {
                    const centrosZona = centros.filter((c) => c.zona.nombre === zona)
                    return (
                      <div key={zona}>
                        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {zona}
                        </p>
                        {centrosZona.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </div>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Mes */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Mes
              </label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((nombre, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Año */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Año
              </label>
              <Select value={año} onValueChange={setAño}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(AÑO_ACTUAL)}>{AÑO_ACTUAL}</SelectItem>
                  <SelectItem value={String(AÑO_ACTUAL - 1)}>{AÑO_ACTUAL - 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={iniciarCaptura}
              disabled={!centroId || pending}
              className="bg-gobierno hover:bg-gobierno/90"
            >
              {pending ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : (
                <ChevronRight className="mr-2 size-4" />
              )}
              Iniciar captura
            </Button>
          </div>
        </div>
      ) : (
        /* Cabecera de la captura activa */
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gobierno/20 bg-gobierno/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-gobierno" />
            <div>
              <p className="text-sm font-semibold text-foreground">{captura.centroNombre}</p>
              <p className="text-xs text-muted-foreground">
                {MESES[captura.mes - 1]} {captura.año}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCaptura(null)}
          >
            Cambiar centro / periodo
          </Button>
        </div>
      )}

      {/* Registrador masivo */}
      {captura && (
        <RegistradorMasivo
          centroId={captura.centroId}
          clases={captura.clases}
          periodoFecha={periodoFecha}
        />
      )}
    </div>
  )
}
