"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Loader2, Phone, GraduationCap, Users } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { TIPOS_PERSONAL, nombreTipoPersonal } from "@/lib/eventos/verano"
import type { PersonalVeranoListado } from "@/lib/data/verano-clases"
import {
  guardarPersonalVerano,
  eliminarPersonalVerano,
} from "@/app/(app)/eventos/verano-difertido/clases/actions"

type Form = { nombre: string; tipo: string; rol: string; telefono: string }
const vacio: Form = { nombre: "", tipo: "maestro", rol: "", telefono: "" }

export function PersonalVeranoTab({ personal }: { personal: PersonalVeranoListado[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(vacio)
  const [guardando, setGuardando] = useState(false)
  const [borrar, setBorrar] = useState<PersonalVeranoListado | null>(null)

  function abrirNuevo() {
    setEditId(null)
    setForm(vacio)
    setOpen(true)
  }
  function abrirEditar(p: PersonalVeranoListado) {
    setEditId(p.id)
    setForm({ nombre: p.nombre, tipo: p.tipo, rol: p.rol ?? "", telefono: p.telefono ?? "" })
    setOpen(true)
  }

  async function guardar() {
    setGuardando(true)
    try {
      const r = await guardarPersonalVerano(editId, {
        ...form,
        tipo: form.tipo as "maestro" | "staff",
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
      <div className="flex justify-end">
        <Button onClick={abrirNuevo} className="gap-2 bg-agua hover:bg-agua-600">
          <Plus className="size-4" />
          Agregar persona
        </Button>
      </div>

      {personal.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Aún no hay personal registrado.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Rol / Área</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {personal.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        p.tipo === "maestro"
                          ? "bg-gobierno-50 text-gobierno"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {p.tipo === "maestro" ? (
                        <GraduationCap className="size-3" />
                      ) : (
                        <Users className="size-3" />
                      )}
                      {nombreTipoPersonal(p.tipo)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.rol || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.telefono ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3.5" />
                        {p.telefono}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setBorrar(p)}
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

      {/* Dialog alta/edición */}
      <Dialog open={open} onOpenChange={(o) => !guardando && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar persona" : "Agregar persona"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre completo *</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PERSONAL.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rol / Área</label>
              <Input
                value={form.rol}
                placeholder="Ej. Coordinación, Karate, Apoyo logístico…"
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
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
        titulo="¿Eliminar a esta persona?"
        descripcion={
          borrar ? `${borrar.nombre} se quitará del personal del curso.` : undefined
        }
        textoConfirmar="Eliminar"
        destructivo
        onConfirm={async () => {
          if (!borrar) return
          const r = await eliminarPersonalVerano(borrar.id)
          if (r.ok) {
            toast.success(r.mensaje ?? "Eliminado")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </div>
  )
}
