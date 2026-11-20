"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { normalizarPrefijo } from "@/lib/entregas/catalogos"
import { guardarCampana } from "@/app/(app)/entregas/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type CampanaValores = {
  nombre: string
  anio: string
  prefijo: string
  descripcion: string
  articulos: { clave: string; nombre: string; disponible: string }[]
}

export function campanaVacia(anio: number): CampanaValores {
  return { nombre: "", anio: String(anio), prefijo: "", descripcion: "", articulos: [{ clave: "", nombre: "", disponible: "" }] }
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-[11px] text-muted-foreground">{ayuda}</span>}
    </label>
  )
}

export function CampanaForm({ id = null, inicial, alTerminar }: { id?: number | null; inicial: CampanaValores; alTerminar: () => void }) {
  const router = useRouter()
  const [v, setV] = useState(inicial)
  const [pendiente, iniciar] = useTransition()
  const cambiarArticulo = (i: number, parcial: Partial<CampanaValores["articulos"][number]>) =>
    setV({ ...v, articulos: v.articulos.map((a, j) => (j === i ? { ...a, ...parcial } : a)) })

  function guardar() {
    iniciar(async () => {
      const r = await guardarCampana(id, {
        ...v,
        articulos: v.articulos.filter((a) => a.nombre.trim() || a.disponible.trim()),
      })
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      alTerminar()
      if (!id) router.push(`/entregas/${r.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <Campo etiqueta="Nombre de la entrega">
        <Input value={v.nombre} onChange={(e) => setV({ ...v, nombre: e.target.value })} placeholder="Ej. Dulces y piñatas · Día del Niño" />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Año">
          <Input type="number" value={v.anio} onChange={(e) => setV({ ...v, anio: e.target.value })} />
        </Campo>
        <Campo etiqueta="Prefijo del folio" ayuda={v.prefijo ? `Folios: ${normalizarPrefijo(v.prefijo)}-001, -002…` : "2 a 6 letras, p. ej. DDN"}>
          <Input value={v.prefijo} maxLength={6} className="uppercase" onChange={(e) => setV({ ...v, prefijo: e.target.value })} placeholder="DDN" />
        </Campo>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-foreground">Qué se entrega</p>
        <div className="space-y-2">
          {v.articulos.map((a, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={a.nombre}
                onChange={(e) => cambiarArticulo(i, { nombre: e.target.value })}
                placeholder="Ej. Bolsitas de dulces"
                className="flex-1"
              />
              <Input
                value={a.disponible}
                inputMode="numeric"
                onChange={(e) => cambiarArticulo(i, { disponible: e.target.value })}
                placeholder="Disponibles"
                className="w-32"
                aria-label="Cantidad disponible"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={v.articulos.length === 1}
                onClick={() => setV({ ...v, articulos: v.articulos.filter((_, j) => j !== i) })}
                aria-label="Quitar artículo"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setV({ ...v, articulos: [...v.articulos, { clave: "", nombre: "", disponible: "" }] })}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-agua hover:underline"
        >
          <Plus className="size-4" /> Agregar artículo
        </button>
        <p className="mt-1 text-[11px] text-muted-foreground">
          &ldquo;Disponibles&rdquo; es tu inventario: así se ve en todo momento cuánto queda por autorizar. Puedes dejarlo vacío.
        </p>
      </div>
      <Campo etiqueta="Descripción" ayuda="Opcional: periodo de recepción, lugar de entrega…">
        <Textarea rows={2} value={v.descripcion} onChange={(e) => setV({ ...v, descripcion: e.target.value })} />
      </Campo>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={alTerminar} disabled={pendiente}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={pendiente} className="bg-agua hover:bg-agua-600">
          {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          {id ? "Guardar cambios" : "Crear entrega"}
        </Button>
      </div>
    </div>
  )
}
