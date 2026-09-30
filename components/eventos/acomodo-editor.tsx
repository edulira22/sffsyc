"use client"

import { useMemo, useState } from "react"
import {
  ArrowRightLeft,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import { cn } from "@/lib/utils"
import {
  ASISTENCIAS_INFORME,
  POR_REVISAR,
  dondeVa,
  normalizarBusqueda,
  type AsistenciaInforme,
  type InvitadoAcomodo,
} from "@/lib/eventos/informe-acomodo"
import {
  cambiarAsistenciaAcomodo,
  darDeBajaInvitadoAcomodo,
  guardarInvitadoAcomodo,
  moverGrupoAcomodo,
} from "@/app/(app)/eventos/informe-karina/acomodo/actions"

type BloqueResumen = { id: string; lugares: number; grupos: string }

type Filtro =
  | "todos"
  | "tejedoras"
  | "por-revisar"
  | string // id de bloque

const MAX_FILAS = 100

const COLOR_ASISTENCIA: Record<AsistenciaInforme, string> = {
  confirmado: "border-agua bg-agua text-white",
  sin_confirmar: "border-slate-400 bg-slate-500 text-white",
  no_asiste: "border-rose-500 bg-rose-500 text-white",
}

export function AcomodoEditor({
  bloques,
  invitadosIniciales,
}: {
  bloques: BloqueResumen[]
  invitadosIniciales: InvitadoAcomodo[]
}) {
  const [invitados, setInvitados] = useState(invitadosIniciales)
  const [q, setQ] = useState("")
  const [asistencia, setAsistencia] = useState<"todas" | AsistenciaInforme>("todas")
  const [ubicacion, setUbicacion] = useState<Filtro>("todos")
  const [editando, setEditando] = useState<InvitadoAcomodo | "nuevo" | null>(null)
  const [moviendo, setMoviendo] = useState(false)
  const [baja, setBaja] = useState<InvitadoAcomodo | null>(null)
  const [pendientes, setPendientes] = useState<Set<number>>(new Set())

  function reemplazar(inv: InvitadoAcomodo) {
    setInvitados((prev) => {
      const i = prev.findIndex((p) => p.id === inv.id)
      if (i === -1) return [...prev, inv].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      const copia = prev.slice()
      copia[i] = inv
      return copia
    })
  }

  // --- Conteos ---
  const conteo = useMemo(() => {
    const c = { confirmado: 0, sin_confirmar: 0, no_asiste: 0, porRevisar: 0 }
    for (const p of invitados) {
      c[p.asistencia as AsistenciaInforme] += 1
      if (p.asistencia === "confirmado" && p.bloques.includes(POR_REVISAR)) c.porRevisar += 1
    }
    return c
  }, [invitados])

  // --- Grupos (para sugerencias y para mover) ---
  const grupos = useMemo(() => {
    const m = new Map<string, { total: number; bloques: string }>()
    for (const p of invitados) {
      const g = m.get(p.grupo)
      m.set(p.grupo, { total: (g?.total ?? 0) + 1, bloques: g?.bloques ?? dondeVa(p) })
    }
    return Array.from(m.entries())
      .map(([grupo, v]) => ({ grupo, ...v }))
      .sort(
        (a, b) =>
          Number(b.bloques === POR_REVISAR) - Number(a.bloques === POR_REVISAR) ||
          a.grupo.localeCompare(b.grupo, "es")
      )
  }, [invitados])

  // --- Filtro + búsqueda ---
  const filtrados = useMemo(() => {
    const palabras = normalizarBusqueda(q).trim().split(/\s+/).filter(Boolean)
    return invitados.filter((p) => {
      if (asistencia !== "todas" && p.asistencia !== asistencia) return false
      if (ubicacion === "tejedoras" && !p.tejedora) return false
      if (ubicacion === "por-revisar" && !p.bloques.includes(POR_REVISAR)) return false
      if (
        ubicacion !== "todos" &&
        ubicacion !== "tejedoras" &&
        ubicacion !== "por-revisar" &&
        !p.bloques.includes(ubicacion)
      )
        return false
      if (palabras.length === 0) return true
      const n = normalizarBusqueda(`${p.nombre} ${p.cargo} ${p.grupo}`)
      return palabras.every((w) => n.includes(w))
    })
  }, [invitados, q, asistencia, ubicacion])

  async function cambiarAsistencia(p: InvitadoAcomodo, a: AsistenciaInforme) {
    if (p.asistencia === a) return
    setPendientes((s) => new Set(s).add(p.id))
    try {
      const r = await cambiarAsistenciaAcomodo(p.id, a)
      if (r.ok && r.invitado) {
        reemplazar(r.invitado)
        toast.success(`${p.nombre}: ${ASISTENCIAS_INFORME.find((x) => x.valor === a)?.label}`)
      } else if (!r.ok) toast.error(r.error)
    } finally {
      setPendientes((s) => {
        const n = new Set(s)
        n.delete(p.id)
        return n
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { etiqueta: "Confirmados", valor: conteo.confirmado, color: "text-agua" },
          { etiqueta: "Sin confirmar", valor: conteo.sin_confirmar, color: "text-slate-600" },
          { etiqueta: "No asisten", valor: conteo.no_asiste, color: "text-rose-600" },
          {
            etiqueta: "Confirmados por revisar",
            valor: conteo.porRevisar,
            color: conteo.porRevisar > 0 ? "text-amber-600" : "text-foreground",
          },
        ].map((c) => (
          <div key={c.etiqueta} className="rounded-xl border bg-white px-4 py-3">
            <p className={cn("text-2xl font-bold tabular-nums", c.color)}>{c.valor}</p>
            <p className="text-xs text-muted-foreground">{c.etiqueta}</p>
          </div>
        ))}
      </div>

      {/* Herramientas */}
      <div className="flex flex-col gap-2 rounded-xl border bg-white p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, cargo o grupo…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={asistencia}
            onChange={(e) => setAsistencia(e.target.value as typeof asistencia)}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            aria-label="Filtrar por asistencia"
          >
            <option value="todas">Toda asistencia</option>
            {ASISTENCIAS_INFORME.map((a) => (
              <option key={a.valor} value={a.valor}>
                {a.label}
              </option>
            ))}
          </select>
          <select
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            aria-label="Filtrar por bloque"
          >
            <option value="todos">Todos los bloques</option>
            {bloques.map((b) => (
              <option key={b.id} value={b.id}>
                Bloque {b.id}
              </option>
            ))}
            <option value="por-revisar">Por revisar</option>
            <option value="tejedoras">Tejedoras</option>
          </select>
          <Button variant="outline" className="gap-2" onClick={() => setMoviendo(true)}>
            <ArrowRightLeft className="size-4" />
            Mover grupo
          </Button>
          <Button className="gap-2 bg-agua hover:bg-agua-600" onClick={() => setEditando("nuevo")}>
            <Plus className="size-4" />
            Agregar invitado
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-4 py-2.5 text-xs text-muted-foreground">
          {filtrados.length === 0
            ? "Sin resultados con estos filtros."
            : filtrados.length > MAX_FILAS
              ? `Mostrando ${MAX_FILAS} de ${filtrados.length}. Busca o filtra para acotar.`
              : `${filtrados.length} ${filtrados.length === 1 ? "invitado" : "invitados"}`}
        </div>
        <ul className="divide-y">
          {filtrados.slice(0, MAX_FILAS).map((p) => {
            const ocupado = pendientes.has(p.id)
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug text-foreground">
                    {p.titulo ? `${p.titulo} ` : ""}
                    {p.nombre}
                  </p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {[p.cargo, p.grupo].filter(Boolean).join(" · ")}
                    {p.nota ? ` · ${p.nota}` : ""}
                  </p>
                </div>

                <span
                  className={cn(
                    "w-fit shrink-0 rounded-md px-2 py-1 text-xs font-bold",
                    p.tejedora
                      ? "bg-agua/10 text-agua-700"
                      : p.bloques.includes(POR_REVISAR)
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gobierno/10 text-gobierno"
                  )}
                >
                  {p.bloques.includes(POR_REVISAR) ? "Por revisar" : dondeVa(p)}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div
                    className={cn("flex overflow-hidden rounded-md border", ocupado && "opacity-50")}
                    role="group"
                    aria-label="Asistencia"
                  >
                    {ASISTENCIAS_INFORME.map((a) => (
                      <button
                        key={a.valor}
                        type="button"
                        disabled={ocupado}
                        onClick={() => cambiarAsistencia(p, a.valor)}
                        aria-pressed={p.asistencia === a.valor}
                        className={cn(
                          "border-r px-2 py-1 text-[11px] font-medium last:border-r-0",
                          p.asistencia === a.valor
                            ? COLOR_ASISTENCIA[a.valor]
                            : "bg-white text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {ocupado && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditando(p)}
                    aria-label={`Editar a ${p.nombre}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-600"
                    onClick={() => setBaja(p)}
                    aria-label={`Quitar a ${p.nombre}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {editando !== null && (
        <DialogoInvitado
          invitado={editando === "nuevo" ? null : editando}
          bloques={bloques}
          grupos={grupos.map((g) => g.grupo)}
          onCerrar={() => setEditando(null)}
          onGuardado={(inv) => {
            reemplazar(inv)
            setEditando(null)
          }}
        />
      )}

      {moviendo && (
        <DialogoMoverGrupo
          bloques={bloques}
          grupos={grupos}
          onCerrar={() => setMoviendo(false)}
          onMovido={(grupo, destino) => {
            setInvitados((prev) =>
              prev.map((p) =>
                p.grupo === grupo ? { ...p, bloques: destino, tejedora: false } : p
              )
            )
            setMoviendo(false)
          }}
        />
      )}

      <ConfirmDialog
        open={baja !== null}
        onOpenChange={(o) => !o && setBaja(null)}
        titulo="¿Quitar a este invitado?"
        descripcion={
          baja
            ? `${baja.nombre} dejará de aparecer en la búsqueda y en las listas del staff. El registro se conserva.`
            : undefined
        }
        textoConfirmar="Quitar"
        destructivo
        onConfirm={async () => {
          if (!baja) return
          const r = await darDeBajaInvitadoAcomodo(baja.id)
          if (r.ok) {
            setInvitados((prev) => prev.filter((p) => p.id !== baja.id))
            toast.success(r.mensaje)
          } else toast.error(r.error)
          setBaja(null)
        }}
      />
    </div>
  )
}

// --- Selector de bloques -----------------------------------------------------

function SelectorBloques({
  bloques,
  valor,
  onChange,
  permitirPorRevisar,
}: {
  bloques: BloqueResumen[]
  valor: string[]
  onChange: (v: string[]) => void
  permitirPorRevisar: boolean
}) {
  const alternar = (id: string) => {
    if (id === POR_REVISAR) return onChange(valor.includes(POR_REVISAR) ? [] : [POR_REVISAR])
    const sinRevisar = valor.filter((v) => v !== POR_REVISAR)
    onChange(sinRevisar.includes(id) ? sinRevisar.filter((v) => v !== id) : [...sinRevisar, id])
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {bloques.map((b) => {
        const on = valor.includes(b.id)
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => alternar(b.id)}
            aria-pressed={on}
            className={cn(
              "min-w-[3.25rem] rounded-md border px-2.5 py-1.5 text-sm font-bold transition-colors",
              on
                ? "border-gobierno bg-gobierno text-white"
                : "border-input bg-white text-foreground hover:border-gobierno/40"
            )}
          >
            {b.id}
          </button>
        )
      })}
      {permitirPorRevisar && (
        <button
          type="button"
          onClick={() => alternar(POR_REVISAR)}
          aria-pressed={valor.includes(POR_REVISAR)}
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors",
            valor.includes(POR_REVISAR)
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500"
          )}
        >
          Por revisar
        </button>
      )}
    </div>
  )
}

// --- Diálogo: agregar / editar -----------------------------------------------

function DialogoInvitado({
  invitado,
  bloques,
  grupos,
  onCerrar,
  onGuardado,
}: {
  invitado: InvitadoAcomodo | null
  bloques: BloqueResumen[]
  grupos: string[]
  onCerrar: () => void
  onGuardado: (inv: InvitadoAcomodo) => void
}) {
  const [f, setF] = useState({
    nombre: invitado?.nombre ?? "",
    titulo: invitado?.titulo ?? "",
    cargo: invitado?.cargo ?? "",
    grupo: invitado?.grupo ?? "",
    bloques: invitado?.bloques ?? [],
    asistencia: (invitado?.asistencia as AsistenciaInforme) ?? "confirmado",
    nota: invitado?.nota ?? "",
    tejedora: invitado?.tejedora ?? false,
  })
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    try {
      const r = await guardarInvitadoAcomodo(invitado?.id ?? null, f)
      if (r.ok && r.invitado) {
        toast.success(r.mensaje)
        onGuardado(r.invitado)
      } else if (!r.ok) toast.error(r.error)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invitado ? "Editar invitado" : "Agregar invitado"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[5.5rem_1fr] gap-2">
            <Campo etiqueta="Título">
              <Input
                value={f.titulo}
                onChange={(e) => setF({ ...f, titulo: e.target.value })}
                placeholder="Lic."
              />
            </Campo>
            <Campo etiqueta="Nombre completo">
              <Input
                value={f.nombre}
                onChange={(e) => setF({ ...f, nombre: e.target.value })}
                autoFocus={!invitado}
              />
            </Campo>
          </div>
          <Campo etiqueta="Cargo">
            <Input value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} />
          </Campo>
          <Campo etiqueta="Grupo">
            <Input
              value={f.grupo}
              onChange={(e) => setF({ ...f, grupo: e.target.value })}
              list="grupos-acomodo"
              placeholder="Elige uno existente o escribe uno nuevo"
            />
            <datalist id="grupos-acomodo">
              {grupos.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Campo>

          <Campo etiqueta="Asistencia">
            <div className="flex overflow-hidden rounded-md border">
              {ASISTENCIAS_INFORME.map((a) => (
                <button
                  key={a.valor}
                  type="button"
                  onClick={() => setF({ ...f, asistencia: a.valor })}
                  aria-pressed={f.asistencia === a.valor}
                  className={cn(
                    "flex-1 border-r px-2 py-2 text-sm font-medium last:border-r-0",
                    f.asistencia === a.valor
                      ? COLOR_ASISTENCIA[a.valor]
                      : "bg-white text-muted-foreground hover:bg-muted"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Campo>

          <Campo etiqueta="Dónde se sienta">
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.tejedora}
                onChange={(e) => setF({ ...f, tejedora: e.target.checked })}
                className="size-4 accent-agua"
              />
              Es tejedora (va aparte, sin bloque)
            </label>
            {!f.tejedora && (
              <>
                <SelectorBloques
                  bloques={bloques}
                  valor={f.bloques}
                  onChange={(b) => setF({ ...f, bloques: b })}
                  permitirPorRevisar
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Puedes elegir varios: el staff lo manda al que tenga lugar.
                </p>
              </>
            )}
          </Campo>

          <Campo etiqueta="Nota (opcional)">
            <Textarea
              value={f.nota}
              onChange={(e) => setF({ ...f, nota: e.target.value })}
              rows={2}
              placeholder="Ej. En representación de…"
            />
          </Campo>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando} className="gap-2 bg-agua hover:bg-agua-600">
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {invitado ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Diálogo: mover grupo ----------------------------------------------------

function DialogoMoverGrupo({
  bloques,
  grupos,
  onCerrar,
  onMovido,
}: {
  bloques: BloqueResumen[]
  grupos: { grupo: string; total: number; bloques: string }[]
  onCerrar: () => void
  onMovido: (grupo: string, destino: string[]) => void
}) {
  const [grupo, setGrupo] = useState(grupos[0]?.grupo ?? "")
  const [destino, setDestino] = useState<string[]>([])
  const [anotar, setAnotar] = useState(true)
  const [moviendo, setMoviendo] = useState(false)
  const actual = grupos.find((g) => g.grupo === grupo)

  async function mover() {
    setMoviendo(true)
    try {
      const r = await moverGrupoAcomodo({ grupo, bloques: destino, anotarEnBloques: anotar })
      if (r.ok) {
        toast.success(r.mensaje)
        onMovido(grupo, r.bloques ?? destino)
      } else toast.error(r.error)
    } finally {
      setMoviendo(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mover un grupo completo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Asigna los mismos bloques a todos los invitados de un grupo. Sirve para
            sacar de «Por revisar» a grupos como Seccionales o Comisarios.
          </p>

          <Campo etiqueta="Grupo">
            <select
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              {grupos.map((g) => (
                <option key={g.grupo} value={g.grupo}>
                  {g.bloques === POR_REVISAR ? "⚠ " : ""}
                  {g.grupo} ({g.total}) — {g.bloques === POR_REVISAR ? "Por revisar" : g.bloques}
                </option>
              ))}
            </select>
            {actual && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {actual.total} {actual.total === 1 ? "invitado" : "invitados"} · hoy en{" "}
                {actual.bloques === POR_REVISAR ? "Por revisar" : actual.bloques}
              </p>
            )}
          </Campo>

          <Campo etiqueta="Nuevo bloque">
            <SelectorBloques
              bloques={bloques}
              valor={destino}
              onChange={setDestino}
              permitirPorRevisar={false}
            />
          </Campo>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={anotar}
              onChange={(e) => setAnotar(e.target.checked)}
              className="mt-0.5 size-4 accent-agua"
            />
            <span>
              Agregar «{grupo}» a la descripción de {destino.length > 1 ? "esos bloques" : "ese bloque"}
              <span className="block text-xs text-muted-foreground">
                Así el staff ve en el bloque que ese grupo va ahí.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCerrar} disabled={moviendo}>
            Cancelar
          </Button>
          <Button
            onClick={mover}
            disabled={moviendo || destino.length === 0 || !grupo}
            className="gap-2 bg-agua hover:bg-agua-600"
          >
            {moviendo && <Loader2 className="size-4 animate-spin" />}
            Mover {actual ? `${actual.total} ${actual.total === 1 ? "invitado" : "invitados"}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">{etiqueta}</p>
      {children}
    </div>
  )
}
