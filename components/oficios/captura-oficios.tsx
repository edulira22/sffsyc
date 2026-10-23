"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileUp,
  Loader2,
  RotateCw,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_BYTES_ARCHIVO, TIPOS_ARCHIVO_PERMITIDOS } from "@/lib/oficios/catalogos"
import type { OficioInput } from "@/lib/schemas/oficio"
import { guardarOficio, leerOficio, registrarOficio } from "@/app/(app)/oficios/actions"
import { CamposOficio, oficioVacio } from "@/components/oficios/campos-oficio"
import { VisorOficio } from "@/components/oficios/visor-oficio"

type Estado = "en_cola" | "subiendo" | "leyendo" | "revisar" | "confirmado" | "error"

type Item = {
  clave: string
  nombre: string
  archivo: File
  vista: string
  estado: Estado
  error?: string
  id?: number
  folio?: string
  formulario: OficioInput
  dudosos: string[]
  observacion: string
  costoUsd?: number
}

/**
 * Reduce una foto a ≤1568 px por lado en JPEG: legible para archivar, ligera
 * para subir y en el tamaño exacto que aprovecha la IA (más grande solo
 * cuesta más tokens sin leer mejor).
 */
async function prepararImagen(file: File): Promise<File> {
  const bmp = await createImageBitmap(file)
  const escala = Math.min(1, 1568 / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * escala)
  const h = Math.round(bmp.height * escala)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("imagen"))), "image/jpeg", 0.82)
  )
  const base = file.name.replace(/\.[^.]+$/, "") || "oficio"
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" })
}

const ETIQUETA: Record<Estado, { texto: string; clase: string }> = {
  en_cola: { texto: "En cola", clase: "bg-muted text-muted-foreground" },
  subiendo: { texto: "Registrando…", clase: "bg-sky-100 text-sky-800" },
  leyendo: { texto: "Leyendo con IA…", clase: "bg-violet-100 text-violet-800" },
  revisar: { texto: "Por revisar", clase: "bg-amber-100 text-amber-800" },
  confirmado: { texto: "Confirmado", clase: "bg-emerald-100 text-emerald-800" },
  error: { texto: "Error", clase: "bg-rose-100 text-rose-800" },
}

export function CapturaOficios({ hoy, iaDisponible }: { hoy: string; iaDisponible: boolean }) {
  const [items, setItems] = useState<Item[]>([])
  const [activo, setActivo] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const inputArchivos = useRef<HTMLInputElement>(null)
  const inputCamara = useRef<HTMLInputElement>(null)

  // Libera las vistas previas al salir.
  const vistas = useRef<string[]>([])
  useEffect(() => () => vistas.current.forEach((u) => URL.revokeObjectURL(u)), [])

  // Avisa si se intenta salir con oficios sin confirmar.
  const pendientes = items.filter((i) => i.estado === "revisar").length
  useEffect(() => {
    if (!pendientes && !procesando) return
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", aviso)
    return () => window.removeEventListener("beforeunload", aviso)
  }, [pendientes, procesando])

  const actualizar = (clave: string, cambios: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)))

  async function agregar(lista: FileList | File[]) {
    const nuevos: Item[] = []
    for (const original of Array.from(lista)) {
      if (!TIPOS_ARCHIVO_PERMITIDOS.includes(original.type)) {
        toast.error(`${original.name}: formato no admitido (usa JPG, PNG o PDF).`)
        continue
      }
      let archivo = original
      if (original.type.startsWith("image/")) {
        try {
          archivo = await prepararImagen(original)
        } catch {
          toast.error(`${original.name}: no se pudo procesar la imagen.`)
          continue
        }
      }
      if (archivo.size > MAX_BYTES_ARCHIVO) {
        toast.error(`${original.name}: pesa más de 4 MB. Escanéalo con menor resolución.`)
        continue
      }
      const vista = URL.createObjectURL(archivo)
      vistas.current.push(vista)
      nuevos.push({
        clave: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nombre: original.name,
        archivo,
        vista,
        estado: "en_cola",
        formulario: oficioVacio(hoy),
        dudosos: [],
        observacion: "",
      })
    }
    if (nuevos.length) setItems((prev) => [...prev, ...nuevos])
  }

  async function leer(item: Item & { id: number }) {
    actualizar(item.clave, { estado: "leyendo", error: undefined })
    const r = await leerOficio(item.id)
    if (r.ok) {
      actualizar(item.clave, {
        estado: "revisar",
        formulario: r.formulario,
        dudosos: r.dudosos,
        observacion: r.observacion,
        costoUsd: r.costoUsd,
      })
    } else {
      // El oficio ya está registrado: se puede capturar a mano.
      actualizar(item.clave, { estado: "revisar", error: r.error })
    }
  }

  async function procesar() {
    setProcesando(true)
    const cola = items.filter((i) => i.estado === "en_cola")
    for (const item of cola) {
      actualizar(item.clave, { estado: "subiendo" })
      const fd = new FormData()
      fd.append("archivo", item.archivo)
      fd.append("nombreOriginal", item.nombre)
      let r: Awaited<ReturnType<typeof registrarOficio>>
      try {
        r = await registrarOficio(fd)
      } catch {
        r = { ok: false, error: "Se perdió la conexión al subir el archivo." }
      }
      if (!r.ok) {
        actualizar(item.clave, { estado: "error", error: r.error })
        continue
      }
      const registrado = { ...item, id: r.id, folio: r.folio }
      actualizar(item.clave, { id: r.id, folio: r.folio })
      setActivo((a) => a ?? item.clave)
      if (iaDisponible) {
        try {
          await leer(registrado)
        } catch {
          actualizar(item.clave, { estado: "revisar", error: "Se perdió la conexión durante la lectura." })
        }
      } else {
        actualizar(item.clave, { estado: "revisar" })
      }
    }
    setProcesando(false)
  }

  async function confirmar(item: Item) {
    if (!item.id) return
    setGuardando(true)
    const r = await guardarOficio(item.id, item.formulario, { confirmar: true })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success(`${item.folio} confirmado`)
    actualizar(item.clave, { estado: "confirmado" })
    const siguiente = items.find((i) => i.clave !== item.clave && i.estado === "revisar")
    if (siguiente) setActivo(siguiente.clave)
  }

  function quitar(clave: string) {
    setItems((prev) => prev.filter((i) => i.clave !== clave))
    if (activo === clave) setActivo(null)
  }

  const actual = items.find((i) => i.clave === activo) ?? null
  const enCola = items.filter((i) => i.estado === "en_cola").length
  const confirmados = items.filter((i) => i.estado === "confirmado").length

  return (
    <div className="space-y-5">
      {!iaDisponible && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          La lectura con IA no está activa (falta configurar la clave de Claude). Puedes registrar los oficios y
          capturar sus datos a mano.
        </div>
      )}

      {/* Entrada de archivos */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          if (!procesando) void agregar(e.dataTransfer.files)
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed bg-white p-6 text-center transition-colors",
          arrastrando ? "border-gobierno bg-gobierno/[0.03]" : "border-border"
        )}
      >
        <FileUp className="mx-auto mb-2 size-8 text-gobierno/70" />
        <p className="text-sm font-medium text-foreground">Arrastra aquí los oficios escaneados</p>
        <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG o PDF · hasta 4 MB cada uno · puedes subir varios</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" className="gap-2" disabled={procesando} onClick={() => inputArchivos.current?.click()}>
            <FileUp className="size-4" /> Elegir archivos
          </Button>
          <Button type="button" variant="outline" className="gap-2" disabled={procesando} onClick={() => inputCamara.current?.click()}>
            <Camera className="size-4" /> Tomar foto
          </Button>
        </div>
        <input
          ref={inputArchivos}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void agregar(e.target.files)
            e.target.value = ""
          }}
        />
        <input
          ref={inputCamara}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            if (e.target.files) void agregar(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Cola */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Oficios ({confirmados}/{items.length} confirmados)
              </p>
            </div>
            {items.map((i) => (
              <button
                key={i.clave}
                type="button"
                onClick={() => i.id && setActivo(i.clave)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors",
                  activo === i.clave ? "border-gobierno ring-1 ring-gobierno/30" : "hover:border-gobierno/30"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{i.folio ?? i.nombre}</p>
                  {i.folio && <p className="truncate text-[11px] text-muted-foreground">{i.nombre}</p>}
                  {i.estado === "error" && <p className="mt-0.5 text-[11px] text-rose-700">{i.error}</p>}
                </div>
                {(i.estado === "subiendo" || i.estado === "leyendo") && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", ETIQUETA[i.estado].clase)}>
                  {ETIQUETA[i.estado].texto}
                </span>
                {(i.estado === "en_cola" || (i.estado === "error" && !i.id)) && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      quitar(i.clave)
                    }}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Quitar ${i.nombre}`}
                  >
                    <Trash2 className="size-3.5" />
                  </span>
                )}
              </button>
            ))}
            {enCola > 0 && (
              <Button className="w-full gap-2 bg-agua hover:bg-agua-600" disabled={procesando} onClick={procesar}>
                {procesando ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Registrar {enCola} {enCola === 1 ? "oficio" : "oficios"}
                {iaDisponible ? " y leer con IA" : ""}
              </Button>
            )}
            {confirmados > 0 && confirmados === items.length && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/oficios">Ir a la bandeja</Link>
              </Button>
            )}
          </div>

          {/* Revisión */}
          {actual?.id ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <VisorOficio src={actual.vista} tipo={actual.archivo.type} className="xl:sticky xl:top-4 xl:self-start" />
              <div className="rounded-2xl border bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{actual.folio}</h2>
                    <p className="text-xs text-muted-foreground">
                      Compara los datos con el escaneo y confirma.
                      {actual.costoUsd !== undefined && ` Lectura IA: US$ ${actual.costoUsd.toFixed(4)}.`}
                    </p>
                  </div>
                  {iaDisponible && actual.estado !== "leyendo" && actual.estado !== "confirmado" && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => leer({ ...actual, id: actual.id! })}>
                      <RotateCw className="size-3.5" /> Leer de nuevo
                    </Button>
                  )}
                </div>

                {actual.estado === "leyendo" ? (
                  <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">
                    <Loader2 className="size-4 animate-spin" /> La IA está leyendo el oficio…
                  </div>
                ) : (
                  <>
                    {actual.error && (
                      <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{actual.error}</p>
                    )}
                    {(actual.observacion || actual.dudosos.length > 0) && (
                      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {actual.observacion || "La IA marcó algunos campos para verificar."}
                      </p>
                    )}
                    <CamposOficio
                      valor={actual.formulario}
                      onChange={(v) => actualizar(actual.clave, { formulario: v })}
                      dudosos={actual.dudosos}
                      deshabilitado={actual.estado === "confirmado"}
                    />
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                      {actual.estado === "confirmado" ? (
                        <>
                          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                            <CheckCircle2 className="size-4" /> Confirmado
                          </span>
                          <Button asChild variant="outline" size="sm" className="ml-auto">
                            <Link href={`/oficios/${actual.id}`}>Abrir expediente</Link>
                          </Button>
                        </>
                      ) : (
                        <Button className="gap-2 bg-agua hover:bg-agua-600" disabled={guardando} onClick={() => confirmar(actual)}>
                          {guardando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                          Confirmar datos
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
              {enCola > 0
                ? "Revisa la lista y presiona «Registrar» para asignar folios."
                : "Elige un oficio de la lista para revisarlo."}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
