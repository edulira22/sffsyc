"use client"

import { useMemo, useState } from "react"
import Link from "@/components/ui/enlace"
import { CalendarClock } from "lucide-react"

import { cn } from "@/lib/utils"
import { DIAS_SEMANA, fechaCorta } from "@/lib/stem/catalogos"
import type { CursoListado } from "@/lib/data/stem"
import { EmptyState } from "@/components/ui-patterns/empty-state"
import { EstadoCursoTexto, Seleccion } from "@/components/stem/ui"

// Horario semanal tipo escuela: una fila por horario (4:00–5:30, 5:30–7:00…),
// una columna por día y en cada celda los cursos de ese horario, uno debajo del
// otro. Debajo, el detalle de cada curso.

// Un color sobrio por clase (solo el filo de la tarjeta y su nombre).
const COLORES = ["#1A3A6B", "#2E8B7A", "#B45309", "#7C3AED", "#BE123C", "#0369A1", "#4D7C0F", "#A21CAF"]

/** "16:30" → "4:30"; con sufijo: "4:30 pm". */
function hora12(h: string, sufijo = false) {
  const [hh, mm] = h.split(":").map(Number)
  const base = `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, "0")}`
  return sufijo ? `${base} ${hh < 12 ? "am" : "pm"}` : base
}
const rango12 = (inicio: string, fin: string) => `${hora12(inicio)}–${hora12(fin, true)}`

function avance(c: CursoListado) {
  if (c.estado === "por_iniciar") return `Inicia el ${fechaCorta(c.inicio)}`
  const quedan = c.totalClases - c.clasesDadas
  return quedan > 0 ? `Clase ${c.clasesDadas} de ${c.totalClases} · quedan ${quedan}` : `Última clase · ${c.totalClases} en total`
}

export function HorarioSemanal({ cursos, hoy }: { cursos: CursoListado[]; hoy: string }) {
  const [conPorIniciar, setConPorIniciar] = useState(false)
  const [profesor, setProfesor] = useState("")

  const visibles = cursos.filter(
    (c) => (c.estado === "en_curso" || (conPorIniciar && c.estado === "por_iniciar")) && (!profesor || c.profesor === profesor)
  )
  const profesores = useMemo(() => Array.from(new Set(cursos.map((c) => c.profesor))).sort(), [cursos])
  const colorDe = useMemo(() => {
    const clases = Array.from(new Set(cursos.map((c) => c.clase))).sort()
    return (clase: string) => COLORES[clases.indexOf(clase) % COLORES.length]
  }, [cursos])
  const porIniciar = cursos.filter((c) => c.estado === "por_iniciar").length

  // Lunes a viernes siempre; sábado y domingo solo si hay clases.
  const dias = DIAS_SEMANA.filter((d) => (d.js >= 1 && d.js <= 5) || visibles.some((c) => c.dias.includes(d.valor)))
  const diaHoy = new Date(`${hoy}T12:00:00Z`).getUTCDay()
  // Filas: cada horario distinto, de más temprano a más tarde.
  const horarios = Array.from(new Set(visibles.map((c) => `${c.horaInicio}-${c.horaFin}`))).sort()

  const ninos = visibles.reduce((s, c) => s + c.inscritos, 0)
  const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const horasSemana = visibles.reduce((s, c) => s + (c.dias.length * (minutos(c.horaFin) - minutos(c.horaInicio))) / 60, 0)

  if (cursos.length === 0) {
    return <EmptyState icono={CalendarClock} titulo="No hay cursos activos" descripcion="Cuando abras un curso aparecerá aquí, en su día y su horario." />
  }

  return (
    <div className="space-y-4">
      {/* Controles y resumen */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <b className="text-foreground">{visibles.length}</b> {visibles.length === 1 ? "curso" : "cursos"} ·{" "}
          <b className="text-foreground">{ninos}</b> {ninos === 1 ? "niño inscrito" : "niños inscritos"} ·{" "}
          <b className="text-foreground">{horasSemana.toLocaleString("es-MX", { maximumFractionDigits: 1 })}</b> horas de clase a la semana
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {profesores.length > 1 && (
            <div className="w-56">
              <Seleccion valor={profesor} onCambio={setProfesor} vacio="Todos los profesores" opciones={profesores.map((p) => ({ valor: p, label: p }))} />
            </div>
          )}
          {porIniciar > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={conPorIniciar} onChange={(e) => setConPorIniciar(e.target.checked)} className="size-4 accent-agua" />
              Incluir los que están por iniciar ({porIniciar})
            </label>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground">
          No hay cursos en curso con este filtro.{porIniciar > 0 && !conPorIniciar && " Marca “Incluir los que están por iniciar” para verlos."}
        </p>
      ) : (
        <>
          {/* Horario semanal (pantallas medianas y grandes) */}
          <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-28 border-b px-2 py-2 text-left text-xs font-medium text-muted-foreground">Horario</th>
                  {dias.map((d) => (
                    <th
                      key={d.valor}
                      className={cn("border-b border-l px-2 py-2 text-center font-semibold", d.js === diaHoy ? "bg-agua/10 text-agua" : "text-gobierno")}
                    >
                      {d.label}
                      {d.js === diaHoy && <span className="ml-1 text-[11px] font-medium">· hoy</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => {
                  const [inicio, fin] = h.split("-")
                  return (
                    <tr key={h} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-2 py-2 align-top text-xs font-medium tabular-nums text-foreground">{rango12(inicio, fin)}</td>
                      {dias.map((d) => {
                        const enCelda = visibles
                          .filter((c) => c.horaInicio === inicio && c.horaFin === fin && c.dias.includes(d.valor))
                          .sort((a, b) => a.clase.localeCompare(b.clase))
                        return (
                          <td key={d.valor} className={cn("border-l p-1.5 align-top", d.js === diaHoy && "bg-agua/[0.04]")}>
                            <div className="space-y-1.5">
                              {enCelda.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/stem/cursos/${c.id}`}
                                  title={`${c.clase} · ${c.profesor}\n${c.horario}\n${c.inscritos} de ${c.cupo} lugares\n${fechaCorta(c.inicio)} – ${fechaCorta(c.fin)}\n${avance(c)}`}
                                  className="block rounded-md border border-l-4 bg-white px-2 py-1.5 text-[11px] leading-snug shadow-sm transition hover:shadow-md"
                                  style={{ borderLeftColor: colorDe(c.clase) }}
                                >
                                  <p className="text-xs font-semibold leading-tight" style={{ color: colorDe(c.clase) }}>
                                    {c.clase}
                                  </p>
                                  <p className="truncate text-muted-foreground">{c.profesor}</p>
                                  <p className="text-foreground">
                                    <b>{c.inscritos}</b> de {c.cupo} niños
                                    {c.inscritos >= c.cupo && <span className="ml-1 font-medium text-amber-700">· lleno</span>}
                                  </p>
                                  <p className="text-muted-foreground">{avance(c)}</p>
                                </Link>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Por día (celular) */}
          <div className="space-y-3 md:hidden">
            {dias.map((d) => {
              const delDia = visibles.filter((c) => c.dias.includes(d.valor)).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
              if (delDia.length === 0) return null
              return (
                <section key={d.valor}>
                  <h3 className={cn("mb-1.5 text-sm font-bold", d.js === diaHoy ? "text-agua" : "text-gobierno")}>
                    {d.label}
                    {d.js === diaHoy && " · hoy"}
                  </h3>
                  <div className="space-y-2">
                    {delDia.map((c) => (
                      <Link
                        key={c.id}
                        href={`/stem/cursos/${c.id}`}
                        className="flex gap-3 rounded-lg border border-l-4 bg-white p-3 text-sm"
                        style={{ borderLeftColor: colorDe(c.clase) }}
                      >
                        <div className="w-24 shrink-0 text-xs font-medium tabular-nums text-foreground">{rango12(c.horaInicio, c.horaFin)}</div>
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: colorDe(c.clase) }}>
                            {c.clase}
                          </p>
                          <p className="text-xs text-muted-foreground">{c.profesor}</p>
                          <p className="text-xs text-foreground">
                            <b>{c.inscritos}</b> de {c.cupo} niños · {avance(c)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {/* Detalle de cada curso */}
          <section>
            <h2 className="mb-2 text-sm font-bold text-gobierno">Detalle de los cursos</h2>
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Clase</th>
                    <th className="px-3 py-2 font-medium">Profesor</th>
                    <th className="px-3 py-2 font-medium">Días y horario</th>
                    <th className="px-3 py-2 font-medium">Niños</th>
                    <th className="px-3 py-2 font-medium">Periodo</th>
                    <th className="px-3 py-2 font-medium">Avance</th>
                  </tr>
                </thead>
                <tbody>
                  {[...visibles]
                    .sort((a, b) => a.clase.localeCompare(b.clase) || a.horario.localeCompare(b.horario))
                    .map((c) => {
                      const pct = c.totalClases ? c.clasesDadas / c.totalClases : 0
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-superficie">
                          <td className="px-3 py-2">
                            <Link href={`/stem/cursos/${c.id}`} className="flex items-center gap-2 font-medium text-foreground hover:underline">
                              <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorDe(c.clase) }} />
                              {c.clase}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{c.profesor}</td>
                          <td className="whitespace-nowrap px-3 py-2">{c.horario}</td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            <b>{c.inscritos}</b> de {c.cupo}
                            {c.inscritos >= c.cupo && <span className="ml-1 text-xs font-medium text-amber-700">Lleno</span>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                            {fechaCorta(c.inicio)} – {fechaCorta(c.fin)}
                          </td>
                          <td className="px-3 py-2">
                            {c.estado === "por_iniciar" ? (
                              <EstadoCursoTexto estado={c.estado} />
                            ) : (
                              <div className="w-44">
                                <p className="mb-1 text-xs text-foreground">{avance(c)}</p>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                  <div className="h-full rounded-full bg-agua" style={{ width: `${pct * 100}%` }} />
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
