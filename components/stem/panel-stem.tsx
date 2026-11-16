import Link from "next/link"
import { CalendarRange, Repeat, UserCheck, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { fechaCorta } from "@/lib/stem/catalogos"
import type { PanelStem as Panel } from "@/lib/data/stem"
import { EstadoCursoTexto, Ocupacion } from "@/components/stem/ui"

function Indicador({ icono: Icono, valor, texto, detalle }: { icono: typeof Users; valor: string | number; texto: string; detalle?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gobierno-50 text-gobierno">
        <Icono className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold tabular-nums text-foreground">{valor}</span>
        <span className="block text-xs text-muted-foreground">{texto}</span>
        {detalle && <span className="block text-[11px] text-muted-foreground">{detalle}</span>}
      </span>
    </div>
  )
}

function Barras({ titulo, datos, color = "bg-agua" }: { titulo: string; datos: { label: string; n: number }[]; color?: string }) {
  const max = Math.max(1, ...datos.map((d) => d.n))
  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-gobierno">{titulo}</h2>
      {datos.every((d) => d.n === 0) ? (
        <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
      ) : (
        <ul className="space-y-2.5">
          {datos.map((d) => (
            <li key={d.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-foreground">{d.label}</span>
                <b className="tabular-nums text-foreground">{d.n}</b>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${(d.n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PanelStem({ panel }: { panel: Panel }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icono={Users} valor={panel.alumnos} texto="Alumnos registrados" detalle={`${panel.inscripciones} inscripciones vigentes`} />
        <Indicador
          icono={CalendarRange}
          valor={panel.cursosEnCurso}
          texto="Cursos en curso"
          detalle={panel.cursosPorIniciar ? `${panel.cursosPorIniciar} por iniciar` : undefined}
        />
        <Indicador icono={UserCheck} valor={panel.asistenciaGeneral == null ? "—" : `${panel.asistenciaGeneral}%`} texto="Asistencia general" />
        <Indicador icono={Repeat} valor={panel.reinscritos} texto="Alumnos reinscritos" detalle="Han tomado más de un curso" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Barras titulo="Alumnos por clase (vigentes)" datos={panel.porClase.map((c) => ({ label: c.clase, n: c.n }))} />
        <Barras titulo="Alumnos por edad" datos={panel.porEdad} color="bg-gobierno" />
        <Barras titulo="Alumnos por sexo" datos={panel.porSexo} color="bg-violet-500" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold text-gobierno">Cursos vigentes</h2>
        {panel.cursosActivos.length === 0 ? (
          <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
            No hay cursos en curso ni por iniciar.{" "}
            <Link href="/stem/cursos/nuevo" className="font-medium text-agua hover:underline">
              Abrir un curso
            </Link>
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <ul className="divide-y">
              {panel.cursosActivos.map((c) => (
                <li key={c.id}>
                  <Link href={`/stem/cursos/${c.id}`} className="grid gap-2 px-4 py-3 hover:bg-muted/30 sm:grid-cols-[1fr_auto_14rem] sm:items-center sm:gap-6">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{c.clase}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.profesor} · {c.horario} · {fechaCorta(c.inicio)} – {fechaCorta(c.fin)}
                      </p>
                    </div>
                    <EstadoCursoTexto estado={c.estado} />
                    <Ocupacion inscritos={c.inscritos} cupo={c.cupo} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
