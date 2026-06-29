"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Loader2, GraduationCap } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import type { ClaseVeranoListado } from "@/lib/data/verano-clases"
import {
  guardarClaseVerano,
  eliminarClaseVerano,
} from "@/app/(app)/eventos/verano-difertido/clases/actions"

type Maestro = { id: number; nombre: string }
type Form = { nombre: string; descripcion: string; maestroId: string }
const vacio: Form = { nombre: "", descripcion: "", maestroId: "0" }

const SIN_MAESTRO = "0"

export function ClasesVeranoTab({
  clases,
  maestros,
}: {
  clases: ClaseVeranoListado[]
  maestros: Maestro[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(vacio)
  const [guardando, setGuardando] = useState(false)
  const [borrar, setBorrar] = useState<ClaseVeranoListado | null>(null)

  function abrirNuevo() {
    setEditId(null)
    setForm(vacio)
    setOpen(true)
  }
  function abrirEditar(c: ClaseVeranoListado) {
    setEditId(c.id)
    setForm({
      nombre: c.nombre,
      descripcion: c.descripcion ?? "",
      maestroId: c.maestroId ? String(c.maestroId) : SIN_MAESTRO,
    })
    setOpen(true)
  }

  async function guardar() {
    setGuardando(true)
    try {
      const r = await guardarClaseVerano(editId, {
        nombre: form.nombre,
        descripcion: form.descripcion,
        maestroId: form.maestroId === SIN_MAESTRO ? null : Number(form.maestroId),
      })
      if (r.ok) {
        toast.success(r.mensaje ?? "Guardado")
        setOpen(false)
        router.refresh()
      } else toast.error(r.error)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {maestros.length === 0 && (
          <p className="text-xs text-amber-700">
            Tip: agrega maestros en la pestaña «Personal» para poder asignarlos.
          </p>
        )}
        <Button onClick={abrirNuevo} className="ml-auto gap-2 bg-agua hover:bg-agua-600">
          <Plus className="size-4" />
          Agregar clase
        </Button>
      </div>

      {clases.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Aún no hay clases/talleres registrados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Clase / Taller</TableHead>
                <TableHead>Maestro asignado</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>
                    {c.maestro ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <GraduationCap className="size-3.5 text-gobierno" />
                        {c.maestro.nombre}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {c.descripcion || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setBorrar(c)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !guardando && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar clase" : "Agregar clase"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre de la clase *</label>
              <Input
                value={form.nombre}
                placeholder="Ej. Karate, Robótica, Pintura…"
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Maestro</label>
              <Select
                value={form.maestroId}
                onValueChange={(v) => setForm({ ...form, maestroId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_MAESTRO}>Sin asignar</SelectItem>
                  {maestros.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando || !form.nombre.trim()}
              className="bg-agua hover:bg-agua-600"
            >
              {guardando && <Loader2 className="size-4 animate-spin" />}
              {editId ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={borrar !== null}
        onOpenChange={(o) => !o && setBorrar(null)}
        titulo="¿Eliminar esta clase?"
        descripcion={
          borrar
            ? `${borrar.nombre} y sus bloques en el horario se eliminarán.`
            : undefined
        }
        textoConfirmar="Eliminar"
        destructivo
        onConfirm={async () => {
          if (!borrar) return
          const r = await eliminarClaseVerano(borrar.id)
          if (r.ok) {
            toast.success(r.mensaje ?? "Eliminada")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </div>
  )
}
