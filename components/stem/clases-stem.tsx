"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bot, Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { ClaseListada } from "@/lib/data/stem"
import { cambiarEstatusClase, guardarClase } from "@/app/(app)/stem/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { Campo } from "@/components/stem/ui"

type Edicion = { id: number | null; nombre: string; resumen: string; edadMinima: string; edadMaxima: string }
const vacia: Edicion = { id: null, nombre: "", resumen: "", edadMinima: "", edadMaxima: "" }

export function ClasesStem({ clases }: { clases: ClaseListada[] }) {
  const router = useRouter()
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [pendiente, iniciar] = useTransition()

  function guardar() {
    if (!edicion) return
    iniciar(async () => {
      const r = await guardarClase(edicion.id, {
        nombre: edicion.nombre,
        resumen: edicion.resumen,
        edadMinima: edicion.edadMinima,
        edadMaxima: edicion.edadMaxima,
      })
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      setEdicion(null)
      router.refresh()
    })
  }

  function alternar(c: ClaseListada) {
    iniciar(async () => {
      const r = await cambiarEstatusClase(c.id, c.estatus === "activa" ? "inactiva" : "activa")
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEdicion(vacia)} className="gap-2 bg-agua hover:bg-agua-600">
          <Plus className="size-4" /> Nueva clase
        </Button>
      </div>

      {clases.length === 0 ? (
        <EmptyState
          icono={Bot}
          titulo="Aún no hay clases"
          descripcion="Crea las clases que se imparten (por ejemplo, VEX IQ). Después podrás abrir cursos de cada una."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clases.map((c) => (
            <div key={c.id} className={cn("flex flex-col rounded-xl border bg-white p-4", c.estatus !== "activa" && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{c.nombre}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.edadMinima || c.edadMaxima ? `De ${c.edadMinima ?? "?"} a ${c.edadMaxima ?? "?"} años` : "Sin rango de edad"}
                    {c.estatus !== "activa" && " · Desactivada"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEdicion({
                      id: c.id,
                      nombre: c.nombre,
                      resumen: c.resumen,
                      edadMinima: c.edadMinima?.toString() ?? "",
                      edadMaxima: c.edadMaxima?.toString() ?? "",
                    })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Editar ${c.nombre}`}
                >
                  <Pencil className="size-4" />
                </button>
              </div>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{c.resumen || "Sin resumen."}</p>
              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Profesores:</span>{" "}
                  {c.profesores.length ? c.profesores.join(", ") : "ninguno todavía"}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span>{c.cursos} {c.cursos === 1 ? "curso" : "cursos"} abiertos en total</span>
                  <button type="button" disabled={pendiente} onClick={() => alternar(c)} className="font-medium text-agua hover:underline">
                    {c.estatus === "activa" ? "Desactivar" : "Reactivar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={edicion !== null} onOpenChange={(v) => !v && !pendiente && setEdicion(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edicion?.id ? "Editar clase" : "Nueva clase"}</DialogTitle>
            <DialogDescription>La clase es el contenido; después abres cursos de ella con fechas, horario y profesor.</DialogDescription>
          </DialogHeader>
          {edicion && (
            <div className="space-y-3">
              <Campo etiqueta="Nombre de la clase">
                <Input value={edicion.nombre} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} placeholder="Ej. VEX IQ" />
              </Campo>
              <Campo etiqueta="Resumen" ayuda="Qué aprenden y qué se necesita, en pocas líneas.">
                <Textarea
                  rows={3}
                  value={edicion.resumen}
                  onChange={(e) => setEdicion({ ...edicion, resumen: e.target.value })}
                  placeholder="Ej. Diseño, construcción y programación de robots VEX IQ para competencia."
                />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Edad mínima" ayuda="Opcional">
                  <Input type="number" min={3} max={99} value={edicion.edadMinima} onChange={(e) => setEdicion({ ...edicion, edadMinima: e.target.value })} />
                </Campo>
                <Campo etiqueta="Edad máxima" ayuda="Opcional">
                  <Input type="number" min={3} max={99} value={edicion.edadMaxima} onChange={(e) => setEdicion({ ...edicion, edadMaxima: e.target.value })} />
                </Campo>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdicion(null)} disabled={pendiente}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={pendiente} className="bg-agua hover:bg-agua-600">
              {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
