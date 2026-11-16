"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  GRADOS_ESCOLARES,
  PARENTESCOS,
  SEXOS,
  TIPOS_ESCUELA,
  datosDeCurp,
  edadEn,
  fechaCorta,
  label,
  limpiarCurp,
} from "@/lib/stem/catalogos"
import type { CursoListado } from "@/lib/data/stem"
import { buscarAlumnoPorCurp, guardarAlumno, inscribirAlumno } from "@/app/(app)/stem/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Campo, Seleccion } from "@/components/stem/ui"

export type AlumnoFormValores = {
  curp: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  escuela: string
  tipoEscuela: string
  gradoEscolar: string
  tutorNombre: string
  tutorParentesco: string
  tutorTelefono: string
  telefonoAlterno: string
  tutorCorreo: string
  salud: string
  observaciones: string
}

const vacio: AlumnoFormValores = {
  curp: "",
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  escuela: "",
  tipoEscuela: "",
  gradoEscolar: "",
  tutorNombre: "",
  tutorParentesco: "",
  tutorTelefono: "",
  telefonoAlterno: "",
  tutorCorreo: "",
  salud: "",
  observaciones: "",
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-gobierno">{titulo}</h2>
      {children}
    </section>
  )
}

export function AlumnoForm({
  hoy,
  id = null,
  inicial = vacio,
  cursos = [],
  cursoInicial = "",
  alGuardar,
}: {
  hoy: string
  id?: number | null
  inicial?: AlumnoFormValores
  /** Cursos abiertos para inscribirlo al registrarlo (solo al crear). */
  cursos?: CursoListado[]
  cursoInicial?: string
  alGuardar?: () => void
}) {
  const router = useRouter()
  const [v, setV] = useState<AlumnoFormValores>(inicial)
  const [cursoId, setCursoId] = useState(cursoInicial)
  const [existente, setExistente] = useState<{ id: number; folio: string; nombre: string } | null>(null)
  const [pendiente, iniciar] = useTransition()
  const cambiar = (parcial: Partial<AlumnoFormValores>) => setV((x) => ({ ...x, ...parcial }))

  const curp = limpiarCurp(v.curp)
  const deCurp = datosDeCurp(curp)

  // En cuanto la CURP está completa, se revisa si el alumno ya existe.
  useEffect(() => {
    let vigente = true
    if (curp.length !== 18 || !deCurp) {
      setExistente(null)
      return
    }
    buscarAlumnoPorCurp(curp).then((r) => vigente && setExistente(r && r.id !== id ? r : null))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curp])

  const curso = cursos.find((c) => String(c.id) === cursoId)

  function guardar() {
    iniciar(async () => {
      const r = await guardarAlumno(id, v, id ? null : cursoId ? Number(cursoId) : null)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(r.mensaje)
      if (alGuardar) alGuardar()
      else router.push(cursoInicial ? `/stem/cursos/${cursoInicial}` : `/stem/alumnos/${r.id}`)
      router.refresh()
    })
  }

  function inscribirExistente() {
    if (!existente || !cursoId) return
    iniciar(async () => {
      const r = await inscribirAlumno(Number(cursoId), existente.id)
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      router.push(`/stem/cursos/${cursoId}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <Seccion titulo="Alumno">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Campo
            etiqueta="CURP"
            ayuda="Con la CURP se identifica al alumno aunque se inscriba varias veces."
            error={curp.length === 18 && !deCurp ? "La CURP no es válida; revísala." : undefined}
          >
            <Input
              value={v.curp}
              onChange={(e) => cambiar({ curp: e.target.value.toUpperCase() })}
              maxLength={18}
              className="font-mono uppercase"
              placeholder="18 caracteres"
            />
          </Campo>
          <div className="flex items-end">
            {deCurp ? (
              <p className="flex items-center gap-1.5 pb-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-green-600" />
                Nació el {fechaCorta(deCurp.fechaNacimiento)} · {edadEn(deCurp.fechaNacimiento, hoy)} años · {label(SEXOS, deCurp.sexo)}
              </p>
            ) : (
              <p className="pb-2 text-xs text-muted-foreground">La fecha de nacimiento, la edad y el sexo se toman de la CURP.</p>
            )}
          </div>
        </div>

        {existente && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-300 bg-white p-3 text-sm sm:flex-row sm:items-center">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <p className="flex-1">
              Esta CURP ya es de <b>{existente.nombre}</b> ({existente.folio}). No hace falta registrarlo de nuevo.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/stem/alumnos/${existente.id}`}>Ver perfil</Link>
              </Button>
              {!id && curso && (
                <Button size="sm" disabled={pendiente} onClick={inscribirExistente} className="bg-agua hover:bg-agua-600">
                  Inscribirlo en {curso.clase}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Campo etiqueta="Nombre(s)">
            <Input value={v.nombres} onChange={(e) => cambiar({ nombres: e.target.value })} />
          </Campo>
          <Campo etiqueta="Primer apellido">
            <Input value={v.apellidoPaterno} onChange={(e) => cambiar({ apellidoPaterno: e.target.value })} />
          </Campo>
          <Campo etiqueta="Segundo apellido">
            <Input value={v.apellidoMaterno} onChange={(e) => cambiar({ apellidoMaterno: e.target.value })} />
          </Campo>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Campo etiqueta="Grado escolar">
            <Seleccion valor={v.gradoEscolar} onCambio={(gradoEscolar) => cambiar({ gradoEscolar })} vacio="Elige…" opciones={GRADOS_ESCOLARES} />
          </Campo>
          <Campo etiqueta="Tipo de escuela">
            <Seleccion valor={v.tipoEscuela} onCambio={(tipoEscuela) => cambiar({ tipoEscuela })} vacio="Sin dato" opciones={TIPOS_ESCUELA} />
          </Campo>
          <Campo etiqueta="Nombre de la escuela">
            <Input value={v.escuela} onChange={(e) => cambiar({ escuela: e.target.value })} />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Madre, padre o tutor">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Campo etiqueta="Nombre completo">
            <Input value={v.tutorNombre} onChange={(e) => cambiar({ tutorNombre: e.target.value })} />
          </Campo>
          <Campo etiqueta="Parentesco">
            <Seleccion valor={v.tutorParentesco} onCambio={(tutorParentesco) => cambiar({ tutorParentesco })} vacio="Elige…" opciones={PARENTESCOS} />
          </Campo>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Campo etiqueta="Teléfono" ayuda="10 dígitos">
            <Input inputMode="tel" value={v.tutorTelefono} onChange={(e) => cambiar({ tutorTelefono: e.target.value })} />
          </Campo>
          <Campo etiqueta="Teléfono alterno" ayuda="Opcional">
            <Input inputMode="tel" value={v.telefonoAlterno} onChange={(e) => cambiar({ telefonoAlterno: e.target.value })} />
          </Campo>
          <Campo etiqueta="Correo" ayuda="Opcional">
            <Input type="email" value={v.tutorCorreo} onChange={(e) => cambiar({ tutorCorreo: e.target.value })} />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Salud y notas">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Alergias, condiciones o medicamentos" ayuda="El profesor lo verá en su lista. Déjalo vacío si no hay.">
            <Textarea rows={2} value={v.salud} onChange={(e) => cambiar({ salud: e.target.value })} />
          </Campo>
          <Campo etiqueta="Observaciones" ayuda="Opcional">
            <Textarea rows={2} value={v.observaciones} onChange={(e) => cambiar({ observaciones: e.target.value })} />
          </Campo>
        </div>
      </Seccion>

      {!id && (
        <Seccion titulo="Inscribirlo en un curso">
          {cursos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay cursos abiertos ahora; podrás inscribirlo después desde su perfil.</p>
          ) : (
            <Campo etiqueta="Curso" ayuda="Opcional. Puedes registrarlo ahora e inscribirlo después.">
              <Seleccion
                valor={cursoId}
                onCambio={setCursoId}
                vacio="Solo registrarlo, sin curso"
                opciones={cursos.map((c) => ({
                  valor: String(c.id),
                  label: `${c.clase} · ${c.horario} · ${c.profesor}${c.inscritos >= c.cupo ? " (lleno)" : ` (${c.cupo - c.inscritos} lugares)`}`,
                }))}
              />
            </Campo>
          )}
        </Seccion>
      )}

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={pendiente || Boolean(existente && !id)} className="bg-agua hover:bg-agua-600">
          {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          {id ? "Guardar cambios" : cursoId ? "Registrar e inscribir" : "Registrar alumno"}
        </Button>
      </div>
    </div>
  )
}
