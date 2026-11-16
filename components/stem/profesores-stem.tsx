"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, KeyRound, Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { ProfesorListado } from "@/lib/data/stem"
import { cambiarEstatusProfesor, cambiarPasswordProfesor, crearProfesor, editarProfesor } from "@/app/(app)/stem/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { Campo } from "@/components/stem/ui"

type Edicion = { id: number | null; nombre: string; email: string; telefono: string; notas: string; password: string; clases: number[] }

export function ProfesoresStem({ profesores, clases }: { profesores: ProfesorListado[]; clases: { id: number; nombre: string }[] }) {
  const router = useRouter()
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [clave, setClave] = useState<{ id: number; nombre: string; password: string } | null>(null)
  const [pendiente, iniciar] = useTransition()

  const nuevo = (): Edicion => ({ id: null, nombre: "", email: "", telefono: "", notas: "", password: "", clases: [] })

  function guardar() {
    if (!edicion) return
    iniciar(async () => {
      const datos = { nombre: edicion.nombre, email: edicion.email, telefono: edicion.telefono, notas: edicion.notas, clases: edicion.clases }
      const r = edicion.id ? await editarProfesor(edicion.id, datos) : await crearProfesor({ ...datos, password: edicion.password })
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      setEdicion(null)
      router.refresh()
    })
  }

  function guardarClave() {
    if (!clave) return
    iniciar(async () => {
      const r = await cambiarPasswordProfesor(clave.id, clave.password)
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      setClave(null)
    })
  }

  function alternar(p: ProfesorListado) {
    iniciar(async () => {
      const r = await cambiarEstatusProfesor(p.id, p.estatus === "activo" ? "inactivo" : "activo")
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Cada profesor entra con su correo y contraseña y solo ve sus cursos: alumnos y asistencia.
        </p>
        <Button onClick={() => setEdicion(nuevo())} disabled={clases.length === 0} className="gap-2 bg-agua hover:bg-agua-600">
          <Plus className="size-4" /> Nuevo profesor
        </Button>
      </div>
      {clases.length === 0 && (
        <p className="text-sm text-amber-800">Primero crea al menos una clase: cada profesor debe tener las clases que puede impartir.</p>
      )}

      {profesores.length === 0 ? (
        <EmptyState icono={GraduationCap} titulo="Aún no hay profesores" descripcion="Registra a los profesores y las clases que pueden dar." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <ul className="divide-y">
            {profesores.map((p) => (
              <li key={p.id} className={cn("flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center", p.estatus !== "activo" && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {p.nombre}
                    {p.estatus !== "activo" && <span className="ml-2 text-xs font-normal text-muted-foreground">· Baja</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.email}
                    {p.telefono && ` · ${p.telefono}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Imparte:</span> {p.clases.map((c) => c.nombre).join(", ") || "—"}
                    {` · ${p.cursosActivos} ${p.cursosActivos === 1 ? "curso vigente" : "cursos vigentes"}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      setEdicion({ id: p.id, nombre: p.nombre, email: p.email, telefono: p.telefono, notas: p.notas, password: "", clases: p.clases.map((c) => c.id) })
                    }
                  >
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setClave({ id: p.id, nombre: p.nombre, password: "" })}>
                    <KeyRound className="size-3.5" /> Contraseña
                  </Button>
                  <Button variant="ghost" size="sm" disabled={pendiente} onClick={() => alternar(p)}>
                    {p.estatus === "activo" ? "Dar de baja" : "Reactivar"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={edicion !== null} onOpenChange={(v) => !v && !pendiente && setEdicion(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edicion?.id ? "Editar profesor" : "Nuevo profesor"}</DialogTitle>
            <DialogDescription>
              {edicion?.id ? "Actualiza su perfil y las clases que imparte." : "Se crea también su acceso a la plataforma, limitado a sus cursos."}
            </DialogDescription>
          </DialogHeader>
          {edicion && (
            <div className="space-y-3">
              <Campo etiqueta="Nombre completo">
                <Input value={edicion.nombre} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} />
              </Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Correo (para entrar)">
                  <Input type="email" value={edicion.email} onChange={(e) => setEdicion({ ...edicion, email: e.target.value })} />
                </Campo>
                <Campo etiqueta="Teléfono" ayuda="10 dígitos">
                  <Input inputMode="tel" value={edicion.telefono} onChange={(e) => setEdicion({ ...edicion, telefono: e.target.value })} />
                </Campo>
              </div>
              {!edicion.id && (
                <Campo etiqueta="Contraseña inicial" ayuda="Mínimo 8 caracteres. Compártela con el profesor.">
                  <Input value={edicion.password} onChange={(e) => setEdicion({ ...edicion, password: e.target.value })} />
                </Campo>
              )}
              <div>
                <p className="mb-1 text-xs font-medium text-foreground">Clases que puede impartir</p>
                <div className="grid gap-1 rounded-lg border p-2 sm:grid-cols-2">
                  {clases.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/40">
                      <input
                        type="checkbox"
                        className="size-4 accent-gobierno"
                        checked={edicion.clases.includes(c.id)}
                        onChange={() =>
                          setEdicion({
                            ...edicion,
                            clases: edicion.clases.includes(c.id) ? edicion.clases.filter((x) => x !== c.id) : [...edicion.clases, c.id],
                          })
                        }
                      />
                      {c.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <Campo etiqueta="Notas" ayuda="Opcional: experiencia, certificaciones, disponibilidad.">
                <Textarea rows={2} value={edicion.notas} onChange={(e) => setEdicion({ ...edicion, notas: e.target.value })} />
              </Campo>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdicion(null)} disabled={pendiente}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={pendiente} className="bg-agua hover:bg-agua-600">
              {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {edicion?.id ? "Guardar cambios" : "Crear profesor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clave !== null} onOpenChange={(v) => !v && !pendiente && setClave(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva contraseña</DialogTitle>
            <DialogDescription>{clave?.nombre} entrará con esta contraseña.</DialogDescription>
          </DialogHeader>
          {clave && (
            <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres">
              <Input value={clave.password} onChange={(e) => setClave({ ...clave, password: e.target.value })} />
            </Campo>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClave(null)} disabled={pendiente}>
              Cancelar
            </Button>
            <Button onClick={guardarClave} disabled={pendiente} className="bg-agua hover:bg-agua-600">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
