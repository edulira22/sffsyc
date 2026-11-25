"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "@/components/ui/enlace"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCheck, ChevronDown, HeartPulse, Loader2, Pencil, Phone, Search, UserPlus, Users, XCircle } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  ESTADOS_ASISTENCIA,
  GRADOS_ESCOLARES,
  PARENTESCOS,
  fechaCorta,
  fechaLarga,
  label,
} from "@/lib/stem/catalogos"
import type { AlumnoBuscable, CursoDetalle as Curso, OpcionesCurso } from "@/lib/data/stem"
import { cancelarCurso, darDeBajaInscripcion, guardarAsistencia, inscribirAlumno } from "@/app/(app)/stem/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CursoForm } from "@/components/stem/curso-form"
import { EstadoCursoTexto, Ocupacion, Porcentaje } from "@/components/stem/ui"

type Pestana = "asistencia" | "alumnos" | "resumen"

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function CursoDetalle({
  curso,
  hoy,
  admin,
  opciones,
  buscables = [],
}: {
  curso: Curso
  hoy: string
  /** Administración del STEM (inscribe, da de baja, edita). El profesor solo ve y toma asistencia. */
  admin: boolean
  opciones?: OpcionesCurso
  buscables?: AlumnoBuscable[]
}) {
  const [pestana, setPestana] = useState<Pestana>(admin ? "alumnos" : "asistencia")
  const [editando, setEditando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const activos = curso.alumnos.filter((a) => a.estatus === "activa")

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{curso.clase}</h1>
              <EstadoCursoTexto estado={curso.estado} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {curso.profesor} · {curso.horario}
            </p>
            <p className="text-sm text-muted-foreground">
              Del {fechaCorta(curso.inicio)} al {fechaCorta(curso.fin)} · {curso.totalClases} clases
              {curso.estado === "en_curso" && ` (van ${curso.clasesDadas})`}
            </p>
          </div>
          {admin && curso.estado !== "cancelado" && opciones && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditando(true)}>
                <Pencil className="size-3.5" /> Editar curso
              </Button>
              <Button variant="ghost" size="sm" className="text-rose-700 hover:text-rose-800" onClick={() => setCancelando(true)}>
                Cancelar curso
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <Ocupacion inscritos={curso.inscritos} cupo={curso.cupo} />
          {(curso.notas || curso.claseResumen) && (
            <p className="text-sm text-muted-foreground">{curso.notas || curso.claseResumen}</p>
          )}
        </div>
        {curso.estado === "cancelado" && (
          <p className="mt-3 text-sm text-rose-700">Curso cancelado: {curso.motivoCancelacion}</p>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 border-b">
        {([
          ["asistencia", "Tomar asistencia"],
          ["alumnos", `Alumnos (${activos.length})`],
          ["resumen", "Resumen de asistencia"],
        ] as const).map(([id, t]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPestana(id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              pestana === id ? "border-gobierno text-gobierno" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {pestana === "asistencia" && <TomarAsistencia curso={curso} hoy={hoy} />}
      {pestana === "alumnos" && <ListaAlumnos curso={curso} admin={admin} buscables={buscables} />}
      {pestana === "resumen" && <ResumenAsistencia curso={curso} />}

      {admin && opciones && (
        <Dialog open={editando} onOpenChange={setEditando}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar curso</DialogTitle>
              <DialogDescription>Los alumnos y la asistencia ya registrada se conservan.</DialogDescription>
            </DialogHeader>
            <CursoForm
              opciones={opciones}
              id={curso.id}
              inicial={{
                claseId: String(curso.claseId),
                profesorId: String(curso.profesorId),
                fechaInicio: curso.inicio,
                fechaFin: curso.fin,
                dias: curso.dias,
                horaInicio: curso.horaInicio,
                horaFin: curso.horaFin,
                cupo: String(curso.cupo),
                notas: curso.notas,
              }}
              alGuardar={() => setEditando(false)}
              alCancelar={() => setEditando(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {admin && <CancelarCurso id={curso.id} abierto={cancelando} cerrar={() => setCancelando(false)} />}
    </div>
  )
}

// --- Tomar asistencia ------------------------------------------------------------------

function TomarAsistencia({ curso, hoy }: { curso: Curso; hoy: string }) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const activos = curso.alumnos.filter((a) => a.estatus === "activa")
  const registradas = useMemo(() => new Map(curso.sesiones.map((s) => [s.fecha, s])), [curso.sesiones])
  // Solo días de clase que ya llegaron, del más reciente al más antiguo.
  const fechas = useMemo(() => curso.fechasClase.filter((f) => f <= hoy).reverse(), [curso.fechasClase, hoy])
  const [fecha, setFecha] = useState(fechas[0] ?? "")
  const sesion = registradas.get(fecha)
  const [marcas, setMarcas] = useState<Record<number, string>>(sesion?.marcas ?? {})
  const [tema, setTema] = useState(sesion?.tema ?? "")

  function elegirFecha(f: string) {
    setFecha(f)
    const s = registradas.get(f)
    setMarcas(s?.marcas ?? {})
    setTema(s?.tema ?? "")
  }

  if (curso.estado === "cancelado") {
    return <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-muted-foreground">El curso está cancelado.</p>
  }
  if (fechas.length === 0) {
    const primera = curso.fechasClase[0]
    return (
      <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
        {primera ? `La primera clase es el ${fechaLarga(primera)}. Ese día podrás tomar asistencia.` : "Este curso no tiene días de clase."}
      </p>
    )
  }
  if (activos.length === 0) {
    return <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-muted-foreground">Aún no hay alumnos inscritos.</p>
  }

  const marcados = activos.filter((a) => marcas[a.id]).length

  function guardar() {
    iniciar(async () => {
      const r = await guardarAsistencia(
        curso.id,
        fecha,
        tema,
        Object.entries(marcas).map(([alumnoId, estado]) => ({ alumnoId: Number(alumnoId), estado }))
      )
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-end">
        <label className="block sm:w-64">
          <span className="mb-1 block text-xs font-medium text-foreground">Día de clase</span>
          <select
            value={fecha}
            onChange={(e) => elegirFecha(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            {fechas.map((f) => (
              <option key={f} value={f}>
                {fechaLarga(f)}
                {f === hoy ? " (hoy)" : ""}
                {registradas.has(f) ? " · ya registrada" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground">Tema de la clase (opcional)</span>
          <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ej. Programación de sensores" maxLength={200} />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {marcados} de {activos.length} marcados
          </p>
          <button
            type="button"
            onClick={() => setMarcas(Object.fromEntries(activos.map((a) => [a.id, "asistio"])))}
            className="flex items-center gap-1.5 text-xs font-medium text-agua hover:underline"
          >
            <CheckCheck className="size-3.5" /> Todos asistieron
          </button>
        </div>
        <ul className="divide-y">
          {activos.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{a.nombre}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.folio} · {a.edad} años
                  {a.salud && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-rose-700">
                      <HeartPulse className="size-3" /> {a.salud}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                {ESTADOS_ASISTENCIA.map((e) => {
                  const activo = marcas[a.id] === e.valor
                  return (
                    <button
                      key={e.valor}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => setMarcas({ ...marcas, [a.id]: e.valor })}
                      className={cn(
                        "h-9 rounded-md border px-3 text-xs font-medium transition-colors",
                        activo ? e.activo : "bg-white text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t px-4 py-3">
          <Button onClick={guardar} disabled={pendiente || marcados === 0} className="bg-agua hover:bg-agua-600">
            {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {registradas.has(fecha) ? "Actualizar asistencia" : "Guardar asistencia"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Alumnos ----------------------------------------------------------------------------

function ListaAlumnos({ curso, admin, buscables }: { curso: Curso; admin: boolean; buscables: AlumnoBuscable[] }) {
  const [abierto, setAbierto] = useState<number | null>(null)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [baja, setBaja] = useState<{ inscripcionId: number; nombre: string } | null>(null)
  const activos = curso.alumnos.filter((a) => a.estatus === "activa")
  const bajas = curso.alumnos.filter((a) => a.estatus !== "activa")
  const puedeInscribir = admin && (curso.estado === "en_curso" || curso.estado === "por_iniciar")

  return (
    <div className="space-y-3">
      {puedeInscribir && (
        <div className="flex justify-end">
          <Button onClick={() => setInscribiendo(true)} disabled={curso.inscritos >= curso.cupo} className="gap-2 bg-agua hover:bg-agua-600">
            <UserPlus className="size-4" /> {curso.inscritos >= curso.cupo ? "Curso lleno" : "Inscribir alumno"}
          </Button>
        </div>
      )}

      {activos.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 size-6" />
          Aún no hay alumnos inscritos.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <ul className="divide-y">
            {activos.map((a) => (
              <FilaAlumno
                key={a.id}
                a={a}
                abierto={abierto === a.id}
                alternar={() => setAbierto(abierto === a.id ? null : a.id)}
                admin={admin}
                alDarDeBaja={() => setBaja({ inscripcionId: a.inscripcionId, nombre: a.nombre })}
              />
            ))}
          </ul>
        </div>
      )}

      {bajas.length > 0 && (
        <details className="rounded-xl border bg-white px-4 py-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {bajas.length} {bajas.length === 1 ? "alumno dado de baja" : "alumnos dados de baja"}
          </summary>
          <ul className="mt-2 space-y-1">
            {bajas.map((a) => (
              <li key={a.id} className="text-muted-foreground">
                <span className="text-foreground">{a.nombre}</span> · {a.motivoBaja}
              </li>
            ))}
          </ul>
        </details>
      )}

      {admin && <InscribirDialog curso={curso} buscables={buscables} abierto={inscribiendo} cerrar={() => setInscribiendo(false)} />}
      {admin && <BajaDialog baja={baja} cerrar={() => setBaja(null)} />}
    </div>
  )
}

function FilaAlumno({
  a,
  abierto,
  alternar,
  admin,
  alDarDeBaja,
}: {
  a: Curso["alumnos"][number]
  abierto: boolean
  alternar: () => void
  admin: boolean
  alDarDeBaja: () => void
}) {
  return (
    <li>
      <button type="button" onClick={alternar} aria-expanded={abierto} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{a.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {a.folio} · {a.edad} años · <span className="font-mono">{a.curp}</span>
          </p>
        </div>
        {a.salud && <HeartPulse className="size-4 shrink-0 text-rose-600" aria-label="Tiene notas de salud" />}
        <div className="w-14 shrink-0 text-right">
          <Porcentaje valor={a.porcentaje} />
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")} />
      </button>
      {abierto && (
        <div className="grid gap-x-6 gap-y-3 bg-muted/20 px-4 pb-4 pt-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Dato titulo="Madre, padre o tutor" valor={`${a.tutorNombre} (${label(PARENTESCOS, a.tutorParentesco)})`} />
          <Dato
            titulo="Teléfono"
            valor={
              <a href={`tel:${a.tutorTelefono}`} className="inline-flex items-center gap-1 text-agua hover:underline">
                <Phone className="size-3.5" /> {a.tutorTelefono}
              </a>
            }
          />
          {a.telefonoAlterno && <Dato titulo="Teléfono alterno" valor={a.telefonoAlterno} />}
          {a.tutorCorreo && <Dato titulo="Correo" valor={a.tutorCorreo} />}
          <Dato titulo="Escuela" valor={[label(GRADOS_ESCOLARES, a.gradoEscolar), a.escuela].filter(Boolean).join(" · ") || "—"} />
          <Dato titulo="Nacimiento" valor={fechaCorta(a.nacimiento)} />
          <Dato titulo="Asistencia" valor={`${a.asistio} asistencias · ${a.falta} faltas · ${a.justificada} justificadas`} />
          <Dato titulo="Inscrito desde" valor={fechaCorta(a.fechaInscripcion)} />
          {a.salud && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-[11px] text-muted-foreground">Salud (alergias, condiciones, medicamentos)</p>
              <p className="flex items-start gap-1.5 font-medium text-rose-800">
                <HeartPulse className="mt-0.5 size-4 shrink-0" /> {a.salud}
              </p>
            </div>
          )}
          {admin && (
            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <Link href={`/stem/alumnos/${a.id}`} className="text-sm font-medium text-agua hover:underline">
                Ver perfil completo
              </Link>
              <button type="button" onClick={alDarDeBaja} className="text-sm font-medium text-rose-700 hover:underline">
                Dar de baja del curso
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{titulo}</p>
      <div className="break-words font-medium text-foreground">{valor}</div>
    </div>
  )
}

function InscribirDialog({ curso, buscables, abierto, cerrar }: { curso: Curso; buscables: AlumnoBuscable[]; abierto: boolean; cerrar: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [pendiente, iniciar] = useTransition()
  const yaInscritos = new Set(curso.alumnos.filter((a) => a.estatus === "activa").map((a) => a.id))
  const palabras = norm(q).trim().split(/\s+/).filter(Boolean)
  const resultados =
    palabras.length === 0
      ? []
      : buscables.filter((b) => palabras.every((p) => norm(`${b.nombre} ${b.curp} ${b.folio}`).includes(p))).slice(0, 8)

  function inscribir(alumnoId: number) {
    iniciar(async () => {
      const r = await inscribirAlumno(curso.id, alumnoId)
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje)
      setQ("")
      cerrar()
      router.refresh()
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && cerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inscribir alumno en {curso.clase}</DialogTitle>
          <DialogDescription>Busca por nombre, CURP o folio. Si es la primera vez que viene, regístralo.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, CURP o ST-0001…" className="pl-9" />
        </div>
        <ul className="max-h-72 divide-y overflow-y-auto">
          {resultados.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{b.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {b.folio} · {b.edad} años · <span className="font-mono">{b.curp}</span>
                </p>
              </div>
              {yaInscritos.has(b.id) ? (
                <span className="text-xs text-muted-foreground">Ya inscrito</span>
              ) : (
                <Button size="sm" disabled={pendiente} onClick={() => inscribir(b.id)} className="bg-agua hover:bg-agua-600">
                  Inscribir
                </Button>
              )}
            </li>
          ))}
          {palabras.length > 0 && resultados.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No se encontró a nadie.</li>}
        </ul>
        <DialogFooter className="sm:justify-between">
          <Link href={`/stem/alumnos/nuevo?curso=${curso.id}`} className="text-sm font-medium text-agua hover:underline">
            Registrar alumno nuevo e inscribirlo
          </Link>
          <Button variant="outline" onClick={cerrar}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BajaDialog({ baja, cerrar }: { baja: { inscripcionId: number; nombre: string } | null; cerrar: () => void }) {
  const router = useRouter()
  const [motivo, setMotivo] = useState("")
  const [pendiente, iniciar] = useTransition()
  return (
    <Dialog open={baja !== null} onOpenChange={(v) => !v && !pendiente && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dar de baja del curso</DialogTitle>
          <DialogDescription>{baja?.nombre} dejará de aparecer en la lista. Su asistencia anterior se conserva.</DialogDescription>
        </DialogHeader>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (p. ej. cambio de horario escolar)" maxLength={300} />
        <DialogFooter>
          <Button variant="outline" onClick={cerrar} disabled={pendiente}>
            Cancelar
          </Button>
          <Button
            disabled={pendiente}
            onClick={() =>
              baja &&
              iniciar(async () => {
                const r = await darDeBajaInscripcion(baja.inscripcionId, motivo)
                if (!r.ok) return void toast.error(r.error)
                toast.success(r.mensaje)
                setMotivo("")
                cerrar()
                router.refresh()
              })
            }
            className="bg-rose-600 hover:bg-rose-700"
          >
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelarCurso({ id, abierto, cerrar }: { id: number; abierto: boolean; cerrar: () => void }) {
  const router = useRouter()
  const [motivo, setMotivo] = useState("")
  const [pendiente, iniciar] = useTransition()
  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && !pendiente && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-rose-600" /> Cancelar curso
          </DialogTitle>
          <DialogDescription>No se borra nada: el curso queda como cancelado con sus alumnos y asistencia.</DialogDescription>
        </DialogHeader>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la cancelación" maxLength={300} />
        <DialogFooter>
          <Button variant="outline" onClick={cerrar} disabled={pendiente}>
            Volver
          </Button>
          <Button
            disabled={pendiente}
            className="gap-1.5 bg-rose-600 hover:bg-rose-700"
            onClick={() =>
              iniciar(async () => {
                const r = await cancelarCurso(id, motivo)
                if (!r.ok) return void toast.error(r.error)
                toast.success(r.mensaje)
                cerrar()
                router.refresh()
              })
            }
          >
            <XCircle className="size-4" /> Cancelar curso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Resumen -------------------------------------------------------------------------------

function ResumenAsistencia({ curso }: { curso: Curso }) {
  const activos = curso.alumnos.filter((a) => a.estatus === "activa")
  if (curso.sesiones.length === 0) {
    return <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-muted-foreground">Aún no se ha tomado asistencia.</p>
  }
  const color: Record<string, string> = { asistio: "text-green-700", falta: "text-rose-700", justificada: "text-amber-700" }
  const corto = Object.fromEntries(ESTADOS_ASISTENCIA.map((e) => [e.valor, e.corto]))
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">A = asistió · F = falta · J = justificada. Las justificadas no cuentan en contra.</p>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-superficie text-left text-xs text-muted-foreground">
              <th className="sticky left-0 bg-superficie px-3 py-2 font-medium">Alumno</th>
              {curso.sesiones.map((s) => (
                <th key={s.id} className="px-2 py-2 text-center font-medium" title={s.tema || undefined}>
                  {new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "UTC" })}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activos.map((a) => (
              <tr key={a.id}>
                <td className="sticky left-0 max-w-[14rem] truncate bg-white px-3 py-2 font-medium text-foreground">{a.nombre}</td>
                {curso.sesiones.map((s) => {
                  const m = s.marcas[a.id]
                  return (
                    <td key={s.id} className={cn("px-2 py-2 text-center font-semibold", m ? color[m] : "text-muted-foreground/50")}>
                      {m ? corto[m] : "·"}
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-right">
                  <Porcentaje valor={a.porcentaje} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
