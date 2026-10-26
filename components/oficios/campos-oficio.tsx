"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AREAS_OFICIO,
  PRIORIDADES_OFICIO,
  TIPOS_OFICIO,
} from "@/lib/oficios/catalogos"
import type { OficioInput } from "@/lib/schemas/oficio"

/** Nombres de campo que usa la IA → campo del formulario. */
const DUDOSO_A_CAMPO: Record<string, keyof OficioInput> = {
  numero_oficio: "numeroOficio",
  fecha_documento: "fechaDocumento",
  fecha_recepcion: "fechaRecepcion",
  remitente: "remitente",
  cargo_remitente: "cargoRemitente",
  dependencia: "dependencia",
  dirigido_a: "dirigidoA",
  asunto: "asunto",
  fecha_limite: "fechaLimite",
}

export function oficioVacio(hoy: string): OficioInput {
  return {
    numeroOficio: "",
    fechaDocumento: "",
    fechaRecepcion: hoy,
    remitente: "",
    cargoRemitente: "",
    dependencia: "",
    dirigidoA: "",
    tipo: "solicitud",
    asunto: "",
    resumen: "",
    areaResponsable: "por_definir",
    prioridad: "normal",
    requiereRespuesta: true,
    fechaLimite: "",
    respuestaNumero: "",
    respuestaFecha: "",
  }
}

const SELECT =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"

export function CamposOficio({
  valor,
  onChange,
  dudosos = [],
  deshabilitado = false,
  conRespuesta = false,
}: {
  valor: OficioInput
  onChange: (v: OficioInput) => void
  dudosos?: string[]
  deshabilitado?: boolean
  conRespuesta?: boolean
}) {
  const marcados = new Set(dudosos.map((d) => DUDOSO_A_CAMPO[d]).filter(Boolean))
  const set = <K extends keyof OficioInput>(k: K, v: OficioInput[K]) => onChange({ ...valor, [k]: v })

  const campo = (k: keyof OficioInput, etiqueta: string, control: React.ReactNode, ancho = "") => (
    <label className={cn("block min-w-0", ancho)}>
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {etiqueta}
        {marcados.has(k) && (
          <span className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">Verificar</span>
        )}
      </span>
      <div className={cn(marcados.has(k) && "rounded-md ring-2 ring-amber-300")}>{control}</div>
    </label>
  )

  const texto = (k: keyof OficioInput, etiqueta: string, ancho = "", placeholder = "") =>
    campo(
      k,
      etiqueta,
      <Input
        value={String(valor[k] ?? "")}
        onChange={(e) => set(k, e.target.value as never)}
        disabled={deshabilitado}
        placeholder={placeholder}
      />,
      ancho
    )

  const fecha = (k: keyof OficioInput, etiqueta: string) =>
    campo(
      k,
      etiqueta,
      <Input type="date" value={String(valor[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} disabled={deshabilitado} />
    )

  return (
    <div className="space-y-5">
      <Seccion titulo="Documento">
        <div className="grid gap-3 sm:grid-cols-2">
          {texto("numeroOficio", "No. de oficio", "", "Ej. UT/DIF/03/2026")}
          {fecha("fechaDocumento", "Fecha del documento")}
          {fecha("fechaRecepcion", "Fecha de recepción (sello)")}
          {campo(
            "tipo",
            "Tipo",
            <select className={SELECT} value={valor.tipo} onChange={(e) => set("tipo", e.target.value as OficioInput["tipo"])} disabled={deshabilitado}>
              {TIPOS_OFICIO.map((t) => (
                <option key={t.valor} value={t.valor}>{t.label}</option>
              ))}
            </select>,
            "sm:col-span-2"
          )}
        </div>
      </Seccion>

      <Seccion titulo="Quién lo envía">
        <div className="grid gap-3 sm:grid-cols-2">
          {texto("remitente", "Remitente (quien firma)")}
          {texto("cargoRemitente", "Cargo")}
          {texto("dependencia", "Dependencia u organización", "sm:col-span-2")}
          {texto("dirigidoA", "Dirigido a", "sm:col-span-2")}
        </div>
      </Seccion>

      <Seccion titulo="Contenido">
        <div className="grid gap-3">
          {texto("asunto", "Asunto", "", "Ej. Solicita uso del auditorio para evento")}
          {campo(
            "resumen",
            "Detalles (fechas, sedes, montos, contactos)",
            <Textarea value={valor.resumen} onChange={(e) => set("resumen", e.target.value)} rows={3} disabled={deshabilitado} className="resize-y" />
          )}
        </div>
      </Seccion>

      <Seccion titulo="Atención">
        <div className="grid gap-3 sm:grid-cols-2">
          {campo(
            "areaResponsable",
            "Área responsable",
            <select className={SELECT} value={valor.areaResponsable} onChange={(e) => set("areaResponsable", e.target.value as OficioInput["areaResponsable"])} disabled={deshabilitado}>
              {AREAS_OFICIO.map((a) => (
                <option key={a.valor} value={a.valor}>{a.label}</option>
              ))}
            </select>
          )}
          {campo(
            "prioridad",
            "Prioridad",
            <select className={SELECT} value={valor.prioridad} onChange={(e) => set("prioridad", e.target.value as OficioInput["prioridad"])} disabled={deshabilitado}>
              {PRIORIDADES_OFICIO.map((p) => (
                <option key={p.valor} value={p.valor}>{p.label}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={valor.requiereRespuesta}
              onChange={(e) => set("requiereRespuesta", e.target.checked)}
              disabled={deshabilitado}
              className="size-4 accent-[#1A3A6B]"
            />
            Requiere respuesta
          </label>
          {fecha("fechaLimite", "Fecha límite")}
        </div>
      </Seccion>

      {conRespuesta && (
        <Seccion titulo="Respuesta enviada">
          <div className="grid gap-3 sm:grid-cols-2">
            {texto("respuestaNumero", "No. de oficio de respuesta")}
            {fecha("respuestaFecha", "Fecha de respuesta")}
          </div>
        </Seccion>
      )}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gobierno">{titulo}</legend>
      {children}
    </fieldset>
  )
}
