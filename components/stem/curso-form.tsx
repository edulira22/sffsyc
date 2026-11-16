"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { DIAS_SEMANA, fechasDeClase, horaValida, minutosEntre } from "@/lib/stem/catalogos"
import type { OpcionesCurso } from "@/lib/data/stem"
import { guardarCurso } from "@/app/(app)/stem/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Campo, Seleccion } from "@/components/stem/ui"

export type CursoFormValores = {
  claseId: string
  profesorId: string
  fechaInicio: string
  fechaFin: string
  dias: string[]
  horaInicio: string
  horaFin: string
  cupo: string
  notas: string
}

export const cursoVacio: CursoFormValores = {
  claseId: "",
  profesorId: "",
  fechaInicio: "",
  fechaFin: "",
  dias: [],
  horaInicio: "16:00",
  horaFin: "18:00",
  cupo: "15",
  notas: "",
}

export function CursoForm({
  opciones,
  id = null,
  inicial = cursoVacio,
  alGuardar,
  alCancelar,
}: {
  opciones: OpcionesCurso
  id?: number | null
  inicial?: CursoFormValores
  alGuardar?: () => void
  alCancelar?: () => void
}) {
  const router = useRouter()
  const [v, setV] = useState<CursoFormValores>(inicial)
  const [pendiente, iniciar] = useTransition()
  const cambiar = (parcial: Partial<CursoFormValores>) => setV((x) => ({ ...x, ...parcial }))

  // Solo profesores que tienen registrada la clase elegida.
  const profesores = useMemo(
    () => opciones.profesores.filter((p) => !v.claseId || p.clases.includes(Number(v.claseId))),
    [opciones.profesores, v.claseId]
  )
  const sesiones = useMemo(
    () => (v.fechaInicio && v.fechaFin && v.fechaFin >= v.fechaInicio ? fechasDeClase(v.fechaInicio, v.fechaFin, v.dias).length : null),
    [v.fechaInicio, v.fechaFin, v.dias]
  )
  const duracion = horaValida(v.horaInicio) && horaValida(v.horaFin) ? minutosEntre(v.horaInicio, v.horaFin) : null

  function guardar() {
    iniciar(async () => {
      const r = await guardarCurso(id, v)
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      if (alGuardar) alGuardar()
      else router.push(`/stem/cursos/${r.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Clase">
          <Seleccion
            valor={v.claseId}
            onCambio={(claseId) => {
              const sigue = opciones.profesores.find((p) => String(p.id) === v.profesorId)?.clases.includes(Number(claseId))
              cambiar({ claseId, profesorId: sigue ? v.profesorId : "" })
            }}
            vacio="Elige la clase…"
            opciones={opciones.clases.map((c) => ({ valor: String(c.id), label: c.nombre }))}
          />
        </Campo>
        <Campo
          etiqueta="Profesor"
          ayuda={v.claseId && profesores.length === 0 ? "Nadie tiene registrada esta clase. Agrégala en el perfil de un profesor." : undefined}
        >
          <Seleccion
            valor={v.profesorId}
            onCambio={(profesorId) => cambiar({ profesorId })}
            vacio={v.claseId ? "Elige al profesor…" : "Primero elige la clase"}
            disabled={!v.claseId}
            opciones={profesores.map((p) => ({ valor: String(p.id), label: p.nombre }))}
          />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Inicio del curso">
          <Input type="date" value={v.fechaInicio} onChange={(e) => cambiar({ fechaInicio: e.target.value })} />
        </Campo>
        <Campo etiqueta="Fin del curso">
          <Input type="date" value={v.fechaFin} min={v.fechaInicio || undefined} onChange={(e) => cambiar({ fechaFin: e.target.value })} />
        </Campo>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-foreground">Días de clase</p>
        <div className="flex flex-wrap gap-1.5">
          {DIAS_SEMANA.map((d) => {
            const activo = v.dias.includes(d.valor)
            return (
              <button
                key={d.valor}
                type="button"
                aria-pressed={activo}
                onClick={() => cambiar({ dias: activo ? v.dias.filter((x) => x !== d.valor) : [...v.dias, d.valor] })}
                className={cn(
                  "h-9 min-w-12 rounded-md border px-3 text-sm font-medium transition-colors",
                  activo ? "border-gobierno bg-gobierno text-white" : "bg-white text-muted-foreground hover:text-foreground"
                )}
              >
                {d.corto}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Campo etiqueta="Hora de inicio">
          <Input type="time" value={v.horaInicio} onChange={(e) => cambiar({ horaInicio: e.target.value })} />
        </Campo>
        <Campo etiqueta="Hora de fin" ayuda={duracion && duracion > 0 ? `${Math.floor(duracion / 60)} h ${duracion % 60 ? `${duracion % 60} min` : ""}` : undefined}>
          <Input type="time" value={v.horaFin} onChange={(e) => cambiar({ horaFin: e.target.value })} />
        </Campo>
        <Campo etiqueta="Cupo" ayuda="Alumnos máximos">
          <Input type="number" min={1} max={100} value={v.cupo} onChange={(e) => cambiar({ cupo: e.target.value })} />
        </Campo>
      </div>

      {sesiones !== null && (
        <p className={cn("text-sm", sesiones === 0 ? "text-amber-800" : "text-muted-foreground")}>
          {sesiones === 0
            ? "Con estas fechas y días no habría ninguna clase."
            : `Serán ${sesiones} ${sesiones === 1 ? "clase" : "clases"} en el periodo.`}
        </p>
      )}

      <Campo etiqueta="Notas" ayuda="Opcional: salón, material, competencia a la que se prepara…">
        <Textarea rows={2} value={v.notas} onChange={(e) => cambiar({ notas: e.target.value })} />
      </Campo>

      <div className="flex justify-end gap-2">
        {alCancelar && (
          <Button variant="outline" onClick={alCancelar} disabled={pendiente}>
            Cancelar
          </Button>
        )}
        <Button onClick={guardar} disabled={pendiente} className="bg-agua hover:bg-agua-600">
          {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          {id ? "Guardar cambios" : "Abrir curso"}
        </Button>
      </div>
    </div>
  )
}
