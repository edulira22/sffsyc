"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, FileUp, Loader2, Pencil, Search, Sparkles, Zap } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { CATEGORIAS, ESTADOS_SOLICITUD, MAX_BYTES_ARCHIVO, TIPOS_ARCHIVO, fechaCorta, label } from "@/lib/entregas/catalogos"
import type { CampanaDetalle } from "@/lib/data/entregas"
import { cambiarEstatusCampana, leerSolicitud, registrarSolicitud } from "@/app/(app)/entregas/actions"
import { prepararImagen } from "@/components/oficios/captura-oficios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarraArticulo } from "@/components/entregas/campanas-lista"
import { CampanaForm } from "@/components/entregas/campana-form"

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
type Filtro = "todas" | "por_revisar" | (typeof ESTADOS_SOLICITUD)[number]["valor"]
type Subida = { nombre: string; estado: "en_cola" | "subiendo" | "leyendo" | "listo" | "error"; detalle?: string }

export function EstadoSolicitudTexto({ estado }: { estado: string }) {
  const e = ESTADOS_SOLICITUD.find((x) => x.valor === estado)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <span className={cn("size-2 shrink-0 rounded-full", e?.punto ?? "bg-slate-400")} />
      {e?.label ?? estado}
    </span>
  )
}

export function CampanaVista({ campana, energia }: { campana: CampanaDetalle; energia: { disponible: boolean; restantes: number } }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [categoria, setCategoria] = useState("")
  const [q, setQ] = useState("")
  const [editando, setEditando] = useState(false)
  const [subidas, setSubidas] = useState<Subida[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [conLirabot, setConLirabot] = useState(energia.disponible && energia.restantes > 0)
  const [pendiente, iniciar] = useTransition()
  const inputArchivos = useRef<HTMLInputElement>(null)
  const abierta = campana.estatus === "abierta"

  const sinLeer = campana.solicitudes.filter((s) => !s.revisado && s.iaEstado !== "leido" && s.tieneArchivo)
  const porRevisar = campana.solicitudes.filter((s) => !s.revisado)

  const lista = useMemo(() => {
    const palabras = norm(q).trim().split(/\s+/).filter(Boolean)
    return campana.solicitudes.filter((s) => {
      if (filtro === "por_revisar" && s.revisado) return false
      if (filtro !== "todas" && filtro !== "por_revisar" && s.estado !== filtro) return false
      if (categoria && s.categoria !== categoria) return false
      const texto = norm(`${s.folio} ${s.solicitante} ${s.cargo} ${s.organizacion} ${s.resumen} ${s.contacto}`)
      return palabras.every((p) => texto.includes(p))
    })
  }, [campana.solicitudes, filtro, categoria, q])

  const actualizar = (i: number, parcial: Partial<Subida>) => setSubidas((xs) => xs.map((x, j) => (j === i ? { ...x, ...parcial } : x)))

  /** Lirabot lee una por una; se detiene si se cansa. Devuelve false si se cansó. */
  async function leerUna(id: number): Promise<{ ok: boolean; cansado: boolean; error?: string }> {
    const r = await leerSolicitud(id)
    if (r.ok) return { ok: true, cansado: false }
    return { ok: false, cansado: r.error.includes("cansado"), error: r.error }
  }

  async function subir(archivos: File[]) {
    const validos = archivos.filter((f) => TIPOS_ARCHIVO.includes(f.type) || f.type.startsWith("image/"))
    if (validos.length === 0) return void toast.error("Sube fotos (JPG, PNG) o PDF.")
    setOcupado(true)
    const inicio = subidas.length
    setSubidas((xs) => [...xs, ...validos.map((f) => ({ nombre: f.name, estado: "en_cola" as const }))])
    let lirabot = conLirabot
    for (let k = 0; k < validos.length; k++) {
      const i = inicio + k
      actualizar(i, { estado: "subiendo" })
      try {
        let f = validos[k]
        if (f.type.startsWith("image/")) f = await prepararImagen(f)
        if (f.size > MAX_BYTES_ARCHIVO) {
          actualizar(i, { estado: "error", detalle: "Pesa más de 4 MB" })
          continue
        }
        const fd = new FormData()
        fd.append("archivo", f)
        const r = await registrarSolicitud(campana.id, fd)
        if (!r.ok) {
          actualizar(i, { estado: "error", detalle: r.error })
          continue
        }
        if (lirabot) {
          actualizar(i, { estado: "leyendo", detalle: r.folio })
          const l = await leerUna(r.id)
          if (l.cansado) lirabot = false
          actualizar(i, { estado: "listo", detalle: l.ok ? `${r.folio} · leída` : `${r.folio} · ${l.error}` })
        } else {
          actualizar(i, { estado: "listo", detalle: r.folio })
        }
      } catch {
        actualizar(i, { estado: "error", detalle: "No se pudo subir" })
      }
    }
    setOcupado(false)
    router.refresh()
  }

  async function leerPendientes() {
    setOcupado(true)
    let leidas = 0
    for (const s of sinLeer) {
      const l = await leerUna(s.id)
      if (l.ok) leidas++
      if (l.cansado) {
        toast.error("Lirabot está cansado, espera hasta mañana.")
        break
      }
    }
    setOcupado(false)
    toast.success(`Lirabot leyó ${leidas} ${leidas === 1 ? "solicitud" : "solicitudes"}. Revísalas y confírmalas.`)
    router.refresh()
  }

  const cuenta = (f: Filtro) =>
    f === "todas" ? campana.solicitudes.length : f === "por_revisar" ? porRevisar.length : campana.solicitudes.filter((s) => s.estado === f).length

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm text-gobierno">
            {campana.prefijo} · {campana.anio}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{campana.nombre}</h1>
          {campana.descripcion && <p className="text-sm text-muted-foreground">{campana.descripcion}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditando(true)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={`/api/entregas/${campana.id}/exportar`} download>
              <Download className="size-3.5" /> Exportar Excel
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await cambiarEstatusCampana(campana.id, abierta ? "cerrada" : "abierta")
                if (r.ok) toast.success(r.mensaje)
                router.refresh()
              })
            }
          >
            {abierta ? "Cerrar entrega" : "Reabrir"}
          </Button>
        </div>
      </div>

      {/* Avance por artículo */}
      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
        {campana.avance.map((a) => (
          <BarraArticulo key={a.clave} a={a} />
        ))}
      </div>

      {/* Subir y leer */}
      {abierta && (
        <div
          className="rounded-xl border border-dashed bg-white p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (!ocupado) subir(Array.from(e.dataTransfer.files))
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-medium text-foreground">Subir solicitudes escaneadas</p>
              <p className="text-sm text-muted-foreground">
                Arrastra aquí las fotos o PDF, o elígelos. Cada una recibe su folio ({campana.prefijo}-001…) al subirse.
              </p>
              {energia.disponible && (
                <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" className="size-4 accent-gobierno" checked={conLirabot} onChange={(e) => setConLirabot(e.target.checked)} />
                  Que Lirabot las lea al subirlas
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="size-3" /> {energia.restantes} lecturas de energía hoy
                  </span>
                </label>
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={inputArchivos}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  subir(Array.from(e.target.files ?? []))
                  e.target.value = ""
                }}
              />
              <Button disabled={ocupado} onClick={() => inputArchivos.current?.click()} className="gap-2 bg-agua hover:bg-agua-600">
                {ocupado ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />} Elegir archivos
              </Button>
            </div>
          </div>
          {subidas.length > 0 && (
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto border-t pt-3 text-sm">
              {subidas.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  {s.estado === "subiendo" || s.estado === "leyendo" ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin text-agua" />
                  ) : (
                    <span className={cn("size-2 shrink-0 rounded-full", s.estado === "error" ? "bg-rose-500" : s.estado === "listo" ? "bg-green-600" : "bg-slate-300")} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.nombre}</span>
                  <span className={cn("shrink-0 text-xs", s.estado === "error" ? "text-rose-700" : "text-foreground")}>
                    {s.estado === "en_cola" ? "En espera" : s.estado === "subiendo" ? "Subiendo…" : s.estado === "leyendo" ? "Lirabot está leyendo…" : s.detalle}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {energia.disponible && sinLeer.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <Sparkles className="size-4 text-violet-600" /> {sinLeer.length} {sinLeer.length === 1 ? "solicitud sin leer" : "solicitudes sin leer"}
          </span>
          <Button size="sm" variant="outline" disabled={ocupado || energia.restantes === 0} onClick={leerPendientes}>
            {energia.restantes === 0 ? "Lirabot está cansado, espera hasta mañana" : `Que Lirabot las lea (${Math.min(sinLeer.length, energia.restantes)})`}
          </Button>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(["todas", "por_revisar", ...ESTADOS_SOLICITUD.map((e) => e.valor)] as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                filtro === f ? "border-gobierno bg-gobierno text-white" : "bg-white text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "todas" ? "Todas" : f === "por_revisar" ? "Por revisar" : label(ESTADOS_SOLICITUD, f)} · {cuenta(f)}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por folio, solicitante, organización o lo que pide…" className="pl-9" />
          </div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="h-10 rounded-md border border-input bg-white px-3 text-sm sm:w-56">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-superficie text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Folio</th>
              <th className="px-3 py-2 font-medium">Quién solicita</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">Qué pide</th>
              {campana.articulos.map((a) => (
                <th key={a.clave} className="px-3 py-2 text-right font-medium" title="Solicitado → autorizado">
                  {a.nombre}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lista.map((s) => (
              <tr key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/entregas/solicitud/${s.id}`)}>
                <td className="px-3 py-2.5 align-top">
                  <Link href={`/entregas/solicitud/${s.id}`} className="font-mono text-xs font-semibold text-gobierno hover:underline" onClick={(e) => e.stopPropagation()}>
                    {s.folio}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">{s.fechaSolicitud ? fechaCorta(s.fechaSolicitud) : "Sin fecha"}</p>
                </td>
                <td className="max-w-[16rem] px-3 py-2.5 align-top">
                  <p className={cn("truncate font-medium", s.solicitante || s.organizacion ? "text-foreground" : "italic text-muted-foreground")}>
                    {s.solicitante || s.organizacion || "Sin capturar"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[s.solicitante ? s.organizacion : "", label(CATEGORIAS, s.categoria)].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="hidden max-w-[22rem] px-3 py-2.5 align-top text-xs text-muted-foreground lg:table-cell">
                  <p className="line-clamp-2">{s.resumen || "—"}</p>
                </td>
                {campana.articulos.map((a) => {
                  const c = s.cantidades[a.clave]
                  return (
                    <td key={a.clave} className="whitespace-nowrap px-3 py-2.5 text-right align-top tabular-nums">
                      <span className="text-muted-foreground">{c?.solicitado ?? "—"}</span>
                      {c?.autorizado != null && <span className="font-semibold text-foreground"> → {c.autorizado}</span>}
                    </td>
                  )
                })}
                <td className="px-3 py-2.5 align-top">
                  <EstadoSolicitudTexto estado={s.estado} />
                  {!s.revisado && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-violet-700">
                      <Sparkles className="size-3" /> {s.iaEstado === "leido" ? "Por revisar" : "Por capturar"}
                    </p>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={4 + campana.articulos.length} className="px-3 py-10 text-center text-muted-foreground">
                  {campana.solicitudes.length === 0 ? "Aún no hay solicitudes: sube los escaneos arriba." : "Ninguna solicitud con estos filtros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">En cada artículo: solicitado → autorizado.</p>

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar entrega</DialogTitle>
            <DialogDescription>Cambiar el inventario disponible no altera las solicitudes ya capturadas.</DialogDescription>
          </DialogHeader>
          {editando && (
            <CampanaForm
              id={campana.id}
              inicial={{
                nombre: campana.nombre,
                anio: String(campana.anio),
                prefijo: campana.prefijo,
                descripcion: campana.descripcion,
                articulos: campana.articulos.map((a) => ({ clave: a.clave, nombre: a.nombre, disponible: a.disponible?.toString() ?? "" })),
              }}
              alTerminar={() => setEditando(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
