"use client"

import { Fragment, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Ban, CheckCircle2, ChevronDown, Download, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { CATEGORIAS, ESTADOS_SOLICITUD, fechaCorta, hoyChihuahua, label, type EstadoSolicitud } from "@/lib/entregas/catalogos"
import type { SolicitudDetalle as Solicitud, SolicitudFormulario } from "@/lib/data/entregas"
import { anularSolicitud, cambiarEstadoSolicitud, guardarSolicitud, leerSolicitud } from "@/app/(app)/entregas/actions"
import { VisorOficio } from "@/components/oficios/visor-oficio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EstadoSolicitudTexto } from "@/components/entregas/campana-vista"

const DUDOSO: Record<string, keyof SolicitudFormulario> = {
  fecha_solicitud: "fechaSolicitud",
  fecha_evento: "fechaEvento",
  solicitante: "solicitante",
  cargo: "cargo",
  organizacion: "organizacion",
  contacto: "contacto",
}

function Campo({ etiqueta, dudoso, children, className }: { etiqueta: string; dudoso?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
        {etiqueta}
        {dudoso && <span className="text-[11px] font-semibold text-amber-700">Verificar</span>}
      </span>
      {children}
    </label>
  )
}

export function SolicitudDetalle({ s }: { s: Solicitud }) {
  const router = useRouter()
  const [f, setF] = useState<SolicitudFormulario>(s.formulario)
  const [pendiente, iniciar] = useTransition()
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoSolicitud | null>(null)
  const [anulando, setAnulando] = useState(false)
  const dudosos = new Set(s.revisado ? [] : s.iaCamposDudosos.map((d) => DUDOSO[d]).filter(Boolean))
  const cantidadesDudosas = !s.revisado && s.iaCamposDudosos.includes("cantidades")
  const cambiar = (parcial: Partial<SolicitudFormulario>) => setF((x) => ({ ...x, ...parcial }))
  const correr = (fn: () => Promise<{ ok: boolean; mensaje?: string; error?: string }>) =>
    iniciar(async () => {
      const r = await fn()
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje ?? "Listo")
      router.refresh()
    })
  const archivoUrl = `/api/entregas/${s.id}/archivo`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/entregas/${s.campana.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {s.campana.nombre}
          </Link>
          <h1 className="font-mono text-2xl font-bold text-gobierno">{s.folio}</h1>
          <p className="text-xs text-muted-foreground">Subida por {s.creadoPor || "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!s.revisado && (
            <span className="flex items-center gap-1 text-xs font-medium text-violet-700">
              <Sparkles className="size-3.5" /> {s.iaEstado === "leido" ? "Lirabot propuso los datos: revísalos" : "Falta capturar"}
            </span>
          )}
          {s.archivo && (
            <Button variant="outline" size="sm" disabled={pendiente} className="gap-1.5" onClick={() => correr(() => leerSolicitud(s.id))}>
              {pendiente ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {s.iaEstado === "leido" ? "Que Lirabot la lea de nuevo" : "Leer con Lirabot"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          <VisorOficio src={s.archivo ? archivoUrl : null} tipo={s.archivo?.tipo ?? ""} />
          {s.archivo && (
            <a href={`${archivoUrl}?descargar=1`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Download className="size-3.5" /> Descargar escaneo
            </a>
          )}
        </div>

        <div className="space-y-4">
          {/* Estado */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Estado</p>
              <EstadoSolicitudTexto estado={s.estado} />
              {s.estado === "entregada" && (
                <p className="text-xs text-muted-foreground">
                  {fechaCorta(s.fechaEntrega)}
                  {s.recibio && ` · recogió ${s.recibio}`}
                </p>
              )}
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-gobierno hover:bg-gobierno/90" disabled={pendiente}>
                  <RefreshCw className="size-4" /> Actualizar estado <ChevronDown className="size-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {ESTADOS_SOLICITUD.map((e) => (
                  <DropdownMenuItem key={e.valor} disabled={e.valor === s.estado} onSelect={() => setEstadoNuevo(e.valor)} className="cursor-pointer items-start gap-2.5 py-2">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.punto)} />
                    <span>
                      <span className="block text-sm font-medium">{e.label}</span>
                      <span className="block text-xs leading-snug text-muted-foreground">{e.descripcion}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Datos */}
          <section className="space-y-3 rounded-lg border bg-white p-4">
            {s.iaObservacion && !s.revisado && <p className="text-xs text-amber-800">Nota de Lirabot: {s.iaObservacion}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Quién solicita (firma)" dudoso={dudosos.has("solicitante")}>
                <Input value={f.solicitante} onChange={(e) => cambiar({ solicitante: e.target.value })} />
              </Campo>
              <Campo etiqueta="Cargo" dudoso={dudosos.has("cargo")}>
                <Input value={f.cargo} onChange={(e) => cambiar({ cargo: e.target.value })} />
              </Campo>
              <Campo etiqueta="Organización" dudoso={dudosos.has("organizacion")}>
                <Input value={f.organizacion} onChange={(e) => cambiar({ organizacion: e.target.value })} placeholder="A.C., regiduría, escuela, colonia…" />
              </Campo>
              <Campo etiqueta="Categoría">
                <select value={f.categoria} onChange={(e) => cambiar({ categoria: e.target.value })} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                  {CATEGORIAS.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Fecha de la solicitud" dudoso={dudosos.has("fechaSolicitud")}>
                <Input type="date" value={f.fechaSolicitud} onChange={(e) => cambiar({ fechaSolicitud: e.target.value })} />
              </Campo>
              <Campo etiqueta="Fecha del evento" dudoso={dudosos.has("fechaEvento")}>
                <Input type="date" value={f.fechaEvento} onChange={(e) => cambiar({ fechaEvento: e.target.value })} />
              </Campo>
            </div>
            <Campo etiqueta="Qué solicita y para qué">
              <Textarea rows={3} value={f.resumen} onChange={(e) => cambiar({ resumen: e.target.value })} placeholder="Evento, a quién beneficia, cuántas personas, lugar…" />
            </Campo>
            <Campo etiqueta="Contacto" dudoso={dudosos.has("contacto")}>
              <Input value={f.contacto} onChange={(e) => cambiar({ contacto: e.target.value })} placeholder="Teléfonos y correos" />
            </Campo>
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
                Cantidades {cantidadesDudosas && <span className="text-[11px] font-semibold text-amber-700">Verificar</span>}
              </p>
              <div className="overflow-hidden rounded-md border">
                <div className="grid grid-cols-[1fr_7rem_7rem] bg-superficie px-3 py-1.5 text-[11px] text-muted-foreground">
                  <span>Artículo</span>
                  <span className="text-right">Solicitado</span>
                  <span className="text-right">Autorizado</span>
                </div>
                {s.articulos.map((a) => (
                  <div key={a.clave} className="grid grid-cols-[1fr_7rem_7rem] items-center gap-2 border-t px-3 py-1.5">
                    <span className="text-sm text-foreground">{a.nombre}</span>
                    <Input
                      inputMode="numeric"
                      value={f.solicitado[a.clave] ?? ""}
                      onChange={(e) => cambiar({ solicitado: { ...f.solicitado, [a.clave]: e.target.value } })}
                      className="h-8 text-right"
                    />
                    <Input
                      inputMode="numeric"
                      value={f.autorizado[a.clave] ?? ""}
                      onChange={(e) => cambiar({ autorizado: { ...f.autorizado, [a.clave]: e.target.value } })}
                      className="h-8 text-right"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Campo etiqueta="Observaciones">
              <Textarea rows={2} value={f.observaciones} onChange={(e) => cambiar({ observaciones: e.target.value })} placeholder="Acuerdos, cómo se le avisó, etc." />
            </Campo>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" disabled={pendiente} onClick={() => correr(() => guardarSolicitud(s.id, f))}>
                Guardar
              </Button>
              {!s.revisado && (
                <Button disabled={pendiente} onClick={() => correr(() => guardarSolicitud(s.id, f, { confirmar: true }))} className="gap-1.5 bg-agua hover:bg-agua-600">
                  <CheckCircle2 className="size-4" /> Confirmar datos
                </Button>
              )}
            </div>
          </section>

          {/* Bitácora */}
          <section className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-foreground">Bitácora</h2>
            <ol className="space-y-2">
              {s.movimientos.map((m) => (
                <li key={m.id} className="text-sm">
                  <p className="text-foreground">{m.descripcion}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.usuario || "—"} · {new Date(m.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <button type="button" onClick={() => setAnulando(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-700">
            <Ban className="size-3.5" /> Anular este registro (escaneo equivocado o duplicado)
          </button>
        </div>
      </div>

      <DialogoEstado s={s} estado={estadoNuevo} autorizadoActual={f.autorizado} solicitadoActual={f.solicitado} cerrar={() => setEstadoNuevo(null)} />
      <DialogoAnular id={s.id} campanaId={s.campana.id} abierto={anulando} cerrar={() => setAnulando(false)} />
    </div>
  )
}

function DialogoEstado({
  s,
  estado,
  autorizadoActual,
  solicitadoActual,
  cerrar,
}: {
  s: Solicitud
  estado: EstadoSolicitud | null
  autorizadoActual: Record<string, string>
  solicitadoActual: Record<string, string>
  cerrar: () => void
}) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [autorizado, setAutorizado] = useState<Record<string, string>>({})
  const [fechaEntrega, setFechaEntrega] = useState(hoyChihuahua())
  const [recibio, setRecibio] = useState("")
  const [nota, setNota] = useState("")
  const info = ESTADOS_SOLICITUD.find((e) => e.valor === estado)
  const pideCantidades = estado === "autorizada" || ((estado === "contactada" || estado === "entregada") && !Object.values(autorizadoActual).some((v) => Number(v) > 0))

  // Al abrir, propone lo ya autorizado o, si no hay, lo solicitado.
  const [abiertoPara, setAbiertoPara] = useState<EstadoSolicitud | null>(null)
  if (estado && abiertoPara !== estado) {
    setAbiertoPara(estado)
    setAutorizado(Object.fromEntries(s.articulos.map((a) => [a.clave, autorizadoActual[a.clave] || solicitadoActual[a.clave] || ""])))
    setNota("")
    setRecibio("")
    setFechaEntrega(hoyChihuahua())
  }
  if (!estado && abiertoPara) setAbiertoPara(null)

  function confirmar() {
    if (!estado) return
    iniciar(async () => {
      const r = await cambiarEstadoSolicitud(s.id, estado, {
        ...(pideCantidades ? { autorizado } : {}),
        fechaEntrega,
        recibio,
        nota,
      })
      if (!r.ok) return void toast.error(r.error)
      toast.success(r.mensaje ?? "Listo")
      cerrar()
      router.refresh()
    })
  }

  return (
    <Dialog open={estado !== null} onOpenChange={(v) => !v && !pendiente && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cambiar a {info?.label}?</DialogTitle>
          <DialogDescription>
            {s.folio} pasará de <b>{label(ESTADOS_SOLICITUD, s.estado)}</b> a <b>{info?.label}</b>. Queda registrado en su bitácora.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {pideCantidades && (
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">¿Cuánto se autoriza?</p>
              <div className="space-y-1.5">
                {s.articulos.map((a) => (
                  <Fragment key={a.clave}>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="flex-1">
                        {a.nombre}
                        {solicitadoActual[a.clave] && <span className="text-xs text-muted-foreground"> (pidió {solicitadoActual[a.clave]})</span>}
                      </span>
                      <Input
                        inputMode="numeric"
                        value={autorizado[a.clave] ?? ""}
                        onChange={(e) => setAutorizado({ ...autorizado, [a.clave]: e.target.value })}
                        className="h-8 w-28 text-right"
                      />
                    </label>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
          {estado === "entregada" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium">
                Fecha de entrega
                <Input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className="mt-1" />
              </label>
              <label className="block text-xs font-medium">
                Quién recogió
                <Input value={recibio} onChange={(e) => setRecibio(e.target.value)} placeholder="Opcional" className="mt-1" />
              </label>
            </div>
          )}
          <Input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={300}
            placeholder={estado === "no_procede" ? "¿Por qué no procede? (obligatorio)" : estado === "contactada" ? "¿Cómo se le avisó? (opcional)" : "Nota (opcional)"}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={cerrar} disabled={pendiente}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={pendiente} className="bg-agua hover:bg-agua-600">
            {pendiente && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Sí, cambiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogoAnular({ id, campanaId, abierto, cerrar }: { id: number; campanaId: number; abierto: boolean; cerrar: () => void }) {
  const router = useRouter()
  const [motivo, setMotivo] = useState("")
  const [pendiente, iniciar] = useTransition()
  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && !pendiente && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anular registro</DialogTitle>
          <DialogDescription>No se borra: deja de aparecer en la entrega y su folio no se vuelve a usar.</DialogDescription>
        </DialogHeader>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (p. ej. escaneo duplicado de DDN-004)" />
        <DialogFooter>
          <Button variant="outline" onClick={cerrar} disabled={pendiente}>
            Volver
          </Button>
          <Button
            disabled={pendiente}
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() =>
              iniciar(async () => {
                const r = await anularSolicitud(id, motivo)
                if (!r.ok) return void toast.error(r.error)
                toast.success(r.mensaje ?? "Anulado")
                router.push(`/entregas/${campanaId}`)
                router.refresh()
              })
            }
          >
            Anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
