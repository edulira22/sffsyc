"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { fechaCorta } from "@/lib/stem/catalogos"
import { PERIODOS, TIPOS_REPORTE, aQuery, type ParametrosReporte, type Periodo, type Reporte, type TipoReporte } from "@/lib/stem/reportes"
import { Button } from "@/components/ui/button"
import { Campo, Seleccion, claseInput } from "@/components/stem/ui"

type Opcion = { id: number; nombre: string }

/** Qué reporte, de qué periodo y con qué filtros. Al generar, cambia la URL (y el Excel usa la misma). */
export function FormReporte({
  inicial,
  clases,
  profesores,
  anios,
}: {
  inicial: ParametrosReporte
  clases: Opcion[]
  profesores: Opcion[]
  anios: string[]
}) {
  const router = useRouter()
  const [p, setP] = useState(inicial)
  const [generando, iniciar] = useTransition()
  const cambiar = (parcial: Partial<ParametrosReporte>) => setP((x) => ({ ...x, ...parcial }))

  return (
    <form
      className="space-y-4 rounded-xl border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(() => router.push(`/stem/reportes?${aQuery(p)}`))
      }}
    >
      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Tipo de reporte</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {TIPOS_REPORTE.map((t) => {
            const activo = p.tipo === t.valor
            return (
              <button
                key={t.valor}
                type="button"
                onClick={() => cambiar({ tipo: t.valor as TipoReporte })}
                aria-pressed={activo}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition",
                  activo ? "border-agua bg-agua/[0.06] ring-1 ring-agua" : "hover:border-slate-300 hover:bg-superficie"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className={cn("size-2 shrink-0 rounded-full", activo ? "bg-agua" : "bg-slate-300")} />
                  {t.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{t.descripcion}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo etiqueta="Periodo">
          <Seleccion valor={p.periodo} onCambio={(v) => cambiar({ periodo: v as Periodo })} opciones={PERIODOS} />
        </Campo>
        {p.periodo === "mes" && (
          <Campo etiqueta="Mes">
            <input type="month" value={p.mes} onChange={(e) => e.target.value && cambiar({ mes: e.target.value })} className={claseInput} />
          </Campo>
        )}
        {p.periodo === "anio" && (
          <Campo etiqueta="Año">
            <Seleccion valor={p.anio} onCambio={(v) => cambiar({ anio: v })} opciones={anios.map((a) => ({ valor: a, label: a }))} />
          </Campo>
        )}
        {p.periodo === "rango" && (
          <>
            <Campo etiqueta="Desde">
              <input type="date" value={p.desde} onChange={(e) => e.target.value && cambiar({ desde: e.target.value })} className={claseInput} />
            </Campo>
            <Campo etiqueta="Hasta">
              <input type="date" value={p.hasta} onChange={(e) => e.target.value && cambiar({ hasta: e.target.value })} className={claseInput} />
            </Campo>
          </>
        )}
        <Campo etiqueta="Clase">
          <Seleccion
            valor={p.clase ? String(p.clase) : ""}
            onCambio={(v) => cambiar({ clase: v ? Number(v) : null })}
            vacio="Todas las clases"
            opciones={clases.map((c) => ({ valor: String(c.id), label: c.nombre }))}
          />
        </Campo>
        <Campo etiqueta="Profesor">
          <Seleccion
            valor={p.profesor ? String(p.profesor) : ""}
            onCambio={(v) => cambiar({ profesor: v ? Number(v) : null })}
            vacio="Todos los profesores"
            opciones={profesores.map((x) => ({ valor: String(x.id), label: x.nombre }))}
          />
        </Campo>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={generando} className="gap-2 bg-agua hover:bg-agua-600">
          {generando ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {generando ? "Generando…" : "Generar reporte"}
        </Button>
      </div>
    </form>
  )
}

const MAX_FILAS_PANTALLA = 300

function celda(v: string | number | null, tipo?: string): string {
  if (v == null || v === "") return "—"
  if (tipo === "fecha" && typeof v === "string") return fechaCorta(v)
  if (tipo === "porcentaje") return `${v}%`
  if (typeof v === "number") return v.toLocaleString("es-MX")
  return v
}

/** Cifras, tabla y botón de Excel del reporte generado. */
export function VistaReporte({ reporte, query }: { reporte: Reporte; query: string }) {
  const r = reporte
  const visibles = r.filas.slice(0, MAX_FILAS_PANTALLA)
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gobierno">{r.titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {r.periodo} · {r.filtros}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href={`/api/stem/reportes?${query}`} download>
            <Download className="size-4" /> Descargar Excel
          </a>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {r.metricas.map((m) => (
          <div key={m.etiqueta} className="rounded-xl border bg-white p-3">
            <p className="text-xs text-muted-foreground">{m.etiqueta}</p>
            <p className="text-2xl font-bold tabular-nums text-foreground">{m.valor}</p>
            {m.nota && <p className="text-[11px] text-muted-foreground">{m.nota}</p>}
          </div>
        ))}
      </div>

      {r.filas.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground">No hay registros para este periodo y filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                {r.columnas.map((c) => (
                  <th key={c.clave} className={cn("whitespace-nowrap px-3 py-2 font-medium", c.tipo && c.tipo !== "texto" && c.tipo !== "fecha" && "text-right")}>
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((f, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-superficie">
                  {r.columnas.map((c) => (
                    <td
                      key={c.clave}
                      className={cn(
                        "px-3 py-2 align-top",
                        c.tipo === "numero" || c.tipo === "porcentaje" ? "whitespace-nowrap text-right tabular-nums" : c.tipo === "fecha" ? "whitespace-nowrap" : "min-w-[8rem]"
                      )}
                    >
                      {celda(f[c.clave], c.tipo)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.filas.length > MAX_FILAS_PANTALLA && (
        <p className="text-xs text-muted-foreground">
          Se muestran {MAX_FILAS_PANTALLA} de {r.filas.length.toLocaleString("es-MX")} registros; el Excel los trae todos.
        </p>
      )}
    </div>
  )
}
