"use client"

import { useState } from "react"
import Link from "@/components/ui/enlace"
import { Gift, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AvanceArticulo, CampanaListada } from "@/lib/data/entregas"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { CampanaForm, campanaVacia } from "@/components/entregas/campana-form"

const n = (v: number) => v.toLocaleString("es-MX")

/** Barra de un artículo: autorizado contra disponible, con lo ya entregado más oscuro. */
export function BarraArticulo({ a }: { a: AvanceArticulo }) {
  const base = Math.max(a.disponible ?? 0, a.autorizado, 1)
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="font-medium text-foreground">{a.nombre}</span>
        <span className="tabular-nums text-muted-foreground">
          <b className="text-foreground">{n(a.autorizado)}</b>
          {a.disponible != null ? ` de ${n(a.disponible)} autorizados` : " autorizados"} · {n(a.entregado)} entregados
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-green-600" style={{ width: `${(a.entregado / base) * 100}%` }} />
        <div className="h-full bg-agua/60" style={{ width: `${(Math.max(0, a.autorizado - a.entregado) / base) * 100}%` }} />
      </div>
      {a.restante != null && (
        <p className={cn("mt-1 text-[11px]", a.restante < 0 ? "font-medium text-rose-700" : "text-muted-foreground")}>
          {a.restante < 0 ? `Se autorizaron ${n(-a.restante)} más de los disponibles` : `Quedan ${n(a.restante)} por autorizar`}
        </p>
      )}
    </div>
  )
}

export function CampanasLista({ campanas, anio }: { campanas: CampanaListada[]; anio: number }) {
  const [creando, setCreando] = useState(false)
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreando(true)} className="gap-2 bg-agua hover:bg-agua-600">
          <Plus className="size-4" /> Nueva entrega
        </Button>
      </div>

      {campanas.length === 0 ? (
        <EmptyState
          icono={Gift}
          titulo="Aún no hay entregas"
          descripcion="Crea una entrega (p. ej. Dulces y piñatas · Día del Niño) con lo que se reparte; luego sube las solicitudes escaneadas."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {campanas.map((c) => (
            <Link key={c.id} href={`/entregas/${c.id}`} className="flex flex-col gap-3 rounded-xl border bg-white p-4 transition hover:-translate-y-px hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-gobierno">{c.prefijo} · {c.anio}</p>
                  <h2 className="font-semibold text-foreground">{c.nombre}</h2>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-foreground">
                  <span className={cn("size-2 rounded-full", c.estatus === "abierta" ? "bg-green-600" : "bg-slate-400")} />
                  {c.estatus === "abierta" ? "Abierta" : "Cerrada"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                <b className="text-foreground">{c.total}</b> solicitudes · {c.pendientes} pendientes · {c.entregadas} entregadas
              </p>
              <div className="space-y-3">
                {c.articulos.map((a) => (
                  <BarraArticulo key={a.clave} a={a} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={creando} onOpenChange={setCreando}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva entrega</DialogTitle>
            <DialogDescription>Una por tema y año. Después subes las solicitudes y cada una recibe su folio.</DialogDescription>
          </DialogHeader>
          {creando && <CampanaForm inicial={campanaVacia(anio)} alTerminar={() => setCreando(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
