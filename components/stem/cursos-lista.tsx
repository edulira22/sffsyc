"use client"

import { useMemo, useState } from "react"
import Link from "@/components/ui/enlace"
import { CalendarRange } from "lucide-react"

import { ESTADOS_CURSO, fechaCorta } from "@/lib/stem/catalogos"
import type { CursoListado } from "@/lib/data/stem"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { EstadoCursoTexto, Ocupacion, Seleccion } from "@/components/stem/ui"

/** Lista de cursos agrupada por estado. `base` arma el enlace de cada curso. */
export function CursosLista({ cursos, base = "/stem/cursos", vacio }: { cursos: CursoListado[]; base?: string; vacio?: React.ReactNode }) {
  const [clase, setClase] = useState("")
  const [profesor, setProfesor] = useState("")

  const clases = useMemo(() => Array.from(new Set(cursos.map((c) => c.clase))).sort(), [cursos])
  const profesores = useMemo(() => Array.from(new Set(cursos.map((c) => c.profesor))).sort(), [cursos])
  const filtrados = cursos.filter((c) => (!clase || c.clase === clase) && (!profesor || c.profesor === profesor))

  if (cursos.length === 0) {
    return <>{vacio ?? <EmptyState icono={CalendarRange} titulo="Aún no hay cursos" descripcion="Abre un curso eligiendo una clase, su profesor y su horario." />}</>
  }

  return (
    <div className="space-y-5">
      {(clases.length > 1 || profesores.length > 1) && (
        <div className="flex flex-wrap gap-2">
          {clases.length > 1 && (
            <div className="w-56">
              <Seleccion valor={clase} onCambio={setClase} vacio="Todas las clases" opciones={clases.map((c) => ({ valor: c, label: c }))} />
            </div>
          )}
          {profesores.length > 1 && (
            <div className="w-56">
              <Seleccion valor={profesor} onCambio={setProfesor} vacio="Todos los profesores" opciones={profesores.map((p) => ({ valor: p, label: p }))} />
            </div>
          )}
        </div>
      )}

      {ESTADOS_CURSO.map((estado) => {
        const grupo = filtrados.filter((c) => c.estado === estado.valor)
        if (grupo.length === 0) return null
        return (
          <section key={estado.valor}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gobierno">
              {estado.label} <span className="font-normal text-muted-foreground">· {grupo.length}</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {grupo.map((c) => (
                <Link key={c.id} href={`${base}/${c.id}`} className="flex flex-col gap-3 rounded-xl border bg-white p-4 transition hover:-translate-y-px hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{c.clase}</p>
                      <p className="text-xs text-muted-foreground">{c.profesor}</p>
                    </div>
                    <EstadoCursoTexto estado={c.estado} className="shrink-0" />
                  </div>
                  <div className="text-sm text-foreground">
                    <p>{c.horario}</p>
                    <p className="text-xs text-muted-foreground">
                      {fechaCorta(c.inicio)} – {fechaCorta(c.fin)}
                      {c.estado === "en_curso" && ` · clase ${c.clasesDadas} de ${c.totalClases}`}
                    </p>
                  </div>
                  <Ocupacion inscritos={c.inscritos} cupo={c.cupo} />
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
