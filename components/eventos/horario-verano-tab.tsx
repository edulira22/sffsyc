"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, Clock, GraduationCap, CalendarDays } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GRUPOS_VERANO, DIAS_VERANO } from "@/lib/eventos/verano"
import type {
  HorarioVeranoListado,
  ClaseVeranoListado,
} from "@/lib/data/verano-clases"
import {
  agregarBloqueHorario,
  eliminarBloqueHorario,
} from "@/app/(app)/eventos/verano-difertido/clases/actions"

const hhmm = (s: string) => s

export function HorarioVeranoTab({
  horario,
  clases,
}: {
  horario: HorarioVeranoListado[]
  clases: ClaseVeranoListado[]
}) {
  const router = useRouter()
  const [equipo, setEquipo] = useState<string>(GRUPOS_VERANO[0].id)
  const [open, setOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    dia: "lunes",
    horaInicio: "09:00",
    horaFin: "10:00",
    claseId: "",
  })

  const delEquipo = horario.filter((b) => b.grupo === equipo)
  const grupo = GRUPOS_VERANO.find((g) => g.id === equipo)

  async function agregar() {
    if (!form.claseId) {
      toast.error("Selecciona la clase")
      return
    }
    setGuardando(true)
    try {
      const r = await agregarBloqueHorario({
        grupo: equipo,
        dia: form.dia,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        claseId: Number(form.claseId),
      })
      if (r.ok) {
        toast.success(r.mensaje ?? "Agregado")
        setOpen(false)
        router.refresh()
      } else toast.error(r.error)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarBloque(id: number) {
    const r = await eliminarBloqueHorario(id)
    if (r.ok) {
      toast.success("Bloque eliminado")
      router.refresh()
    } else toast.error(r.error)
  }

  return (
    <div className="space-y-4">
      {/* Selector de equipo + agregar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Equipo:</span>
          <Select value={equipo} onValueChange={setEquipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRUPOS_VERANO.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setForm({ dia: "lunes", horaInicio: "09:00", horaFin: "10:00", claseId: "" })
            setOpen(true)
          }}
          disabled={clases.length === 0}
          className="ml-auto gap-2 bg-agua hover:bg-agua-600"
        >
          <Plus className="size-4" />
          Agregar al horario
        </Button>
      </div>

      {clases.length === 0 && (
        <p className="text-xs text-amber-700">
          Primero registra clases en la pestaña «Clases» para poder armar el horario.
        </p>
      )}

      {/* Horario tipo escolar: una columna por día */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DIAS_VERANO.map((d) => {
          const bloques = delEquipo
            .filter((b) => b.dia === d.id)
            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
          return (
            <div key={d.id} className="rounded-xl border bg-white">
              <div
                className="rounded-t-xl px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: grupo?.hex ?? "#1A3A6B" }}
              >
                {d.label}
              </div>
              <div className="space-y-2 p-2">
                {bloques.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">
                    Sin clases
                  </p>
                ) : (
                  bloques.map((b) => (
                    <div
                      key={b.id}
                      className="group rounded-lg border bg-muted/20 p-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Clock className="size-3 text-muted-foreground" />
                          {hhmm(b.horaInicio)}–{hhmm(b.horaFin)}
                        </span>
                        <button
                          type="button"
                          onClick={() => borrarBloque(b.id)}
                          className="text-muted-foreground/40 transition-colors hover:text-destructive"
                          aria-label="Quitar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{b.clase.nombre}</p>
                      {b.clase.maestro && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <GraduationCap className="size-3" />
                          {b.clase.maestro.nombre}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {delEquipo.length === 0 && clases.length > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {grupo?.nombre} aún no tiene horario. Usa «Agregar al horario».
        </div>
      )}

      {/* Dialog agregar bloque */}
      <Dialog open={open} onOpenChange={(o) => !guardando && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar al horario de {grupo?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Clase *</label>
              <Select
                value={form.claseId}
                onValueChange={(v) => setForm({ ...form, claseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la clase" />
                </SelectTrigger>
                <SelectContent>
                  {clases.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                      {c.maestro ? ` · ${c.maestro.nombre}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Día *</label>
              <Select value={form.dia} onValueChange={(v) => setForm({ ...form, dia: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_VERANO.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hora inicio *</label>
                <Input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hora fin *</label>
                <Input
                  type="time"
                  value={form.horaFin}
                  onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={agregar}
              disabled={guardando}
              className={cn("bg-agua hover:bg-agua-600")}
            >
              {guardando && <Loader2 className="size-4 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
