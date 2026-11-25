"use client"

import { useState, useTransition } from "react"
import Link from "@/components/ui/enlace"
import { useRouter } from "next/navigation"
import { HeartPulse, Pencil, Phone } from "lucide-react"
import { toast } from "sonner"

import { GRADOS_ESCOLARES, PARENTESCOS, SEXOS, TIPOS_ESCUELA, fechaCorta, label } from "@/lib/stem/catalogos"
import type { AlumnoDetalle as Alumno, CursoListado } from "@/lib/data/stem"
import { inscribirAlumno } from "@/app/(app)/stem/actions"
import { Button } from "@/components/ui/button"
import { AlumnoForm } from "@/components/stem/alumno-form"
import { EstadoCursoTexto, Porcentaje, Seleccion } from "@/components/stem/ui"

export function AlumnoDetalle({ alumno, cursos, hoy }: { alumno: Alumno; cursos: CursoListado[]; hoy: string }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [cursoId, setCursoId] = useState("")
  const [pendiente, iniciar] = useTransition()
  const f = alumno.formulario
  const yaEn = new Set(alumno.historial.filter((h) => h.estatus === "activa").map((h) => h.curso.id))
  const disponibles = cursos.filter((c) => !yaEn.has(c.id))

  function inscribir() {
    if (!cursoId) return
    iniciar(async () => {
      const r = await inscribirAlumno(Number(cursoId), alumno.id)
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      setCursoId("")
      router.refresh()
    })
  }

  if (editando) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Editar a {alumno.nombre}</h1>
          <Button variant="outline" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
        <AlumnoForm hoy={hoy} id={alumno.id} inicial={f} alGuardar={() => setEditando(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-gobierno">{alumno.folio}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{alumno.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {alumno.edad} años · {label(SEXOS, alumno.sexo)} · nació el {fechaCorta(alumno.nacimiento)} ·{" "}
              <span className="font-mono">{f.curp}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditando(true)}>
            <Pencil className="size-3.5" /> Editar datos
          </Button>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Dato titulo="Escuela" valor={[label(GRADOS_ESCOLARES, f.gradoEscolar), f.escuela, f.tipoEscuela && label(TIPOS_ESCUELA, f.tipoEscuela)].filter(Boolean).join(" · ")} />
          <Dato titulo="Madre, padre o tutor" valor={`${f.tutorNombre} (${label(PARENTESCOS, f.tutorParentesco)})`} />
          <Dato
            titulo="Teléfono"
            valor={
              <a href={`tel:${f.tutorTelefono}`} className="inline-flex items-center gap-1 text-agua hover:underline">
                <Phone className="size-3.5" /> {f.tutorTelefono}
              </a>
            }
          />
          <Dato titulo="Otro contacto" valor={[f.telefonoAlterno, f.tutorCorreo].filter(Boolean).join(" · ") || "—"} />
        </dl>
        {f.salud && (
          <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-rose-800">
            <HeartPulse className="mt-0.5 size-4 shrink-0" /> {f.salud}
          </p>
        )}
        {f.observaciones && <p className="mt-2 text-sm text-muted-foreground">{f.observaciones}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Registrado el {fechaCorta(alumno.registrado)}</p>
      </div>

      <section className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-bold text-gobierno">
            Cursos ({alumno.historial.length})
            {alumno.historial.length > 1 && <span className="ml-2 font-normal text-muted-foreground">· se ha reinscrito</span>}
          </h2>
          {disponibles.length > 0 && (
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="min-w-0 flex-1 sm:w-80">
                <Seleccion
                  valor={cursoId}
                  onCambio={setCursoId}
                  vacio="Inscribir en otro curso…"
                  opciones={disponibles.map((c) => ({
                    valor: String(c.id),
                    label: `${c.clase} · ${c.horario}${c.inscritos >= c.cupo ? " (lleno)" : ""}`,
                  }))}
                />
              </div>
              <Button disabled={!cursoId || pendiente} onClick={inscribir} className="bg-agua hover:bg-agua-600">
                Inscribir
              </Button>
            </div>
          )}
        </div>
        {alumno.historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se ha inscrito en ningún curso.</p>
        ) : (
          <ul className="divide-y">
            {alumno.historial.map((h) => (
              <li key={h.inscripcionId} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/stem/cursos/${h.curso.id}`} className="font-medium text-foreground hover:text-agua">
                    {h.curso.clase}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {h.curso.profesor} · {h.curso.horario} · {fechaCorta(h.curso.inicio)} – {fechaCorta(h.curso.fin)}
                  </p>
                  {h.estatus !== "activa" && <p className="text-xs text-rose-700">Baja: {h.motivoBaja}</p>}
                </div>
                <EstadoCursoTexto estado={h.curso.estado} />
                <div className="w-28 text-right text-xs text-muted-foreground">
                  <Porcentaje valor={h.porcentaje} /> {h.sesiones > 0 && `· ${h.sesiones} clases`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{titulo}</dt>
      <dd className="break-words font-medium text-foreground">{valor || "—"}</dd>
    </div>
  )
}
