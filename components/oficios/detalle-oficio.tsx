"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  CheckCircle2,
  Download,
  History,
  Loader2,
  MessageSquarePlus,
  RotateCw,
  Save,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ESTADOS_OFICIO, type EstadoOficio } from "@/lib/oficios/catalogos"
import type { OficioDetalle } from "@/lib/data/oficios"
import type { OficioInput } from "@/lib/schemas/oficio"
import {
  agregarNotaOficio,
  anularOficio,
  cambiarEstadoOficio,
  guardarOficio,
  leerOficio,
} from "@/app/(app)/oficios/actions"
import { CamposOficio } from "@/components/oficios/campos-oficio"
import { EstadoBadge, PlazoBadge, RevisionBadge } from "@/components/oficios/insignias"
import { VisorOficio } from "@/components/oficios/visor-oficio"

const ICONO_MOV: Record<string, string> = {
  registro: "bg-gobierno",
  lectura_ia: "bg-violet-500",
  revision: "bg-emerald-500",
  edicion: "bg-slate-400",
  estado: "bg-sky-500",
  nota: "bg-amber-500",
  anulacion: "bg-rose-500",
}

function fechaHora(d: Date | string) {
  return new Date(d).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function DetalleOficio({ oficio, hoy, iaDisponible }: { oficio: OficioDetalle; hoy: string; iaDisponible: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState<OficioInput>(oficio.formulario)
  const [dudosos, setDudosos] = useState<string[]>(oficio.revisado ? [] : oficio.iaCamposDudosos)
  const [aviso, setAviso] = useState(oficio.revisado ? "" : oficio.iaObservacion)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoOficio | "">("")
  const [notaEstado, setNotaEstado] = useState("")
  const [nota, setNota] = useState("")
  const [anulando, setAnulando] = useState(false)
  const [motivo, setMotivo] = useState("")

  const sinGuardar = JSON.stringify(form) !== JSON.stringify(oficio.formulario)
  const archivoUrl = `/api/oficios/${oficio.id}/archivo`

  async function correr(clave: string, fn: () => Promise<{ ok: boolean; error?: string; mensaje?: string }>) {
    setOcupado(clave)
    try {
      const r = await fn()
      if (!r.ok) {
        toast.error(r.error ?? "No se pudo completar.")
        return false
      }
      if (r.mensaje) toast.success(r.mensaje)
      router.refresh()
      return true
    } finally {
      setOcupado(null)
    }
  }

  async function releer() {
    setOcupado("leer")
    try {
      const r = await leerOficio(oficio.id)
      if (!r.ok) return toast.error(r.error)
      setForm(r.formulario)
      setDudosos(r.dudosos)
      setAviso(r.observacion)
      toast.success(
        r.guardado
          ? "Datos leídos con IA. Revísalos y confirma."
          : "Propuesta de la IA cargada en el formulario. Revísala y guarda si es correcta."
      )
      if (r.guardado) router.refresh()
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-mono text-2xl font-bold text-gobierno">{oficio.folio}</h1>
        <EstadoBadge estado={oficio.estado} className="text-xs" />
        <PlazoBadge estado={oficio.estado} fechaLimite={oficio.formulario.fechaLimite || null} hoy={hoy} />
        <RevisionBadge revisado={oficio.revisado} iaEstado={oficio.iaEstado} />
        <span className="text-xs text-muted-foreground">
          Registrado por {oficio.creadoPorNombre || "—"} · {fechaHora(oficio.createdAt)}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Escaneo */}
        <div className="space-y-2 xl:sticky xl:top-4 xl:self-start">
          <VisorOficio src={oficio.archivo ? archivoUrl : null} tipo={oficio.archivo?.tipo ?? ""} />
          {oficio.archivo && (
            <a href={`${archivoUrl}?descargar=1`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Download className="size-3.5" /> Descargar ({oficio.archivo.nombreOriginal}, {Math.max(1, Math.round(oficio.archivo.tamano / 1024))} KB)
            </a>
          )}
        </div>

        <div className="space-y-4">
          {/* Seguimiento */}
          <section className="rounded-2xl border bg-white p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-bold text-foreground">Seguimiento</h2>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS_OFICIO.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  disabled={e.valor === oficio.estado}
                  onClick={() => setNuevoEstado(e.valor)}
                  title={e.descripcion}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    e.valor === oficio.estado
                      ? cn(e.clase, "cursor-default font-bold")
                      : nuevoEstado === e.valor
                        ? "border-gobierno bg-gobierno text-white"
                        : "bg-white text-muted-foreground hover:border-gobierno/40"
                  )}
                >
                  {e.label}
                </button>
              ))}
            </div>
            {nuevoEstado && (
              <div className="mt-3 space-y-2 rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{ESTADOS_OFICIO.find((e) => e.valor === nuevoEstado)?.descripcion}</p>
                <Textarea
                  value={notaEstado}
                  onChange={(e) => setNotaEstado(e.target.value)}
                  rows={2}
                  placeholder={
                    nuevoEstado === "archivado"
                      ? "¿Por qué se archiva? (obligatorio)"
                      : nuevoEstado === "turnado"
                        ? "¿A quién se turnó? (opcional)"
                        : "Nota (opcional)"
                  }
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-gobierno hover:bg-gobierno/90"
                    disabled={ocupado === "estado"}
                    onClick={async () => {
                      const ok = await correr("estado", () => cambiarEstadoOficio(oficio.id, nuevoEstado, notaEstado))
                      if (ok) {
                        setNuevoEstado("")
                        setNotaEstado("")
                      }
                    }}
                  >
                    {ocupado === "estado" && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                    Cambiar a {ESTADOS_OFICIO.find((e) => e.valor === nuevoEstado)?.label}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNuevoEstado("")}>Cancelar</Button>
                </div>
              </div>
            )}
            {oficio.estado === "atendido" && form.requiereRespuesta && !form.respuestaNumero && (
              <p className="mt-3 text-xs text-amber-800">
                Este oficio requería respuesta: registra el número y la fecha del oficio de respuesta abajo.
              </p>
            )}
          </section>

          {/* Datos */}
          <section className="rounded-2xl border bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-foreground">Datos del oficio</h2>
                {!oficio.revisado && (
                  <p className="text-xs text-muted-foreground">Compara con el escaneo y confirma para darlos por buenos.</p>
                )}
              </div>
              {iaDisponible && (
                <Button variant="outline" size="sm" className="gap-1.5" disabled={ocupado === "leer"} onClick={releer}>
                  {ocupado === "leer" ? <Loader2 className="size-3.5 animate-spin" /> : oficio.iaEstado === "leido" ? <RotateCw className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  {oficio.iaEstado === "leido" ? "Leer de nuevo con IA" : "Leer con IA"}
                </Button>
              )}
            </div>
            {aviso && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{aviso}</p>}
            <CamposOficio valor={form} onChange={setForm} dudosos={dudosos} conRespuesta />
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
              {!oficio.revisado && (
                <Button
                  className="gap-2 bg-agua hover:bg-agua-600"
                  disabled={!!ocupado}
                  onClick={() => correr("guardar", () => guardarOficio(oficio.id, form, { confirmar: true }))}
                >
                  {ocupado === "guardar" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Confirmar datos
                </Button>
              )}
              <Button
                variant={oficio.revisado ? "default" : "outline"}
                className={cn("gap-2", oficio.revisado && "bg-agua hover:bg-agua-600")}
                disabled={!!ocupado || !sinGuardar}
                onClick={() => correr("guardar-solo", () => guardarOficio(oficio.id, form))}
              >
                {ocupado === "guardar-solo" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Guardar cambios
              </Button>
              {sinGuardar && <span className="self-center text-xs text-amber-700">Hay cambios sin guardar</span>}
            </div>
          </section>

          {/* Bitácora */}
          <section className="rounded-2xl border bg-white p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <History className="size-4" /> Bitácora
            </h2>
            <div className="mb-4 flex gap-2">
              <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={1} placeholder="Agregar una nota (llamada, acuerdo, entrega…)" className="min-h-10 resize-y" />
              <Button
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={ocupado === "nota" || nota.trim().length < 2}
                onClick={async () => {
                  if (await correr("nota", () => agregarNotaOficio(oficio.id, nota))) setNota("")
                }}
              >
                <MessageSquarePlus className="size-4" /> Agregar
              </Button>
            </div>
            <ol className="relative space-y-3 border-l pl-4">
              {oficio.movimientos.map((m) => (
                <li key={m.id} className="relative">
                  <span className={cn("absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-2 ring-white", ICONO_MOV[m.tipo] ?? "bg-slate-400")} />
                  <p className="text-sm text-foreground">{m.descripcion}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.usuarioNombre || "—"} · {fechaHora(m.fecha)}
                  </p>
                </li>
              ))}
            </ol>
            {oficio.lecturas.length > 0 && (
              <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
                Lecturas con IA: {oficio.lecturas.length} · costo total US${" "}
                {oficio.lecturas.reduce((a, l) => a + l.costoUsd, 0).toFixed(4)}
              </p>
            )}
          </section>

          {/* Anular */}
          <section className="rounded-2xl border border-dashed p-4">
            {!anulando ? (
              <button type="button" onClick={() => setAnulando(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-700">
                <Ban className="size-3.5" /> Anular este registro (archivo equivocado o duplicado)
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-rose-800">
                  El registro dejará de aparecer en la bandeja. No se borra y su folio no se reutiliza.
                </p>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Motivo de la anulación" />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={ocupado === "anular" || motivo.trim().length < 3}
                    onClick={async () => {
                      setOcupado("anular")
                      const r = await anularOficio(oficio.id, motivo)
                      setOcupado(null)
                      if (!r.ok) return toast.error(r.error)
                      toast.success(r.mensaje ?? "Registro anulado.")
                      router.push("/oficios")
                    }}
                  >
                    Anular registro
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAnulando(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
