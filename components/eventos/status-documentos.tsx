"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { FileCheck2, Loader2, Receipt, Printer, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DOCUMENTOS_VERANO,
  TOTAL_REQUISITOS,
} from "@/lib/eventos/verano"
import { actualizarStatusVerano } from "@/app/(app)/eventos/verano-difertido/inscripciones/actions"

// Panel de status de requisitos (solo pantalla, no se imprime). Marca los
// documentos entregados y captura el número de recibo de pago; guarda en BD
// al instante.
export function StatusDocumentos({
  id,
  documentosIniciales,
  reciboInicial,
}: {
  id: number
  documentosIniciales: string[]
  reciboInicial: string
}) {
  const [marcados, setMarcados] = useState<string[]>(documentosIniciales)
  const [recibo, setRecibo] = useState(reciboInicial)
  const [guardando, startTransition] = useTransition()

  function guardar(docs: string[], rec: string, previo: string[]) {
    startTransition(async () => {
      const r = await actualizarStatusVerano(id, docs, rec)
      if (!r.ok) {
        toast.error(r.error)
        setMarcados(previo) // revertir documentos
      }
    })
  }

  function toggle(docId: string) {
    const nuevos = marcados.includes(docId)
      ? marcados.filter((d) => d !== docId)
      : [...marcados, docId]
    const previo = marcados
    setMarcados(nuevos)
    guardar(nuevos, recibo, previo)
  }

  function guardarRecibo() {
    guardar(marcados, recibo, marcados)
  }

  const completos = marcados.length + (recibo.trim() ? 1 : 0)
  const todo = completos === TOTAL_REQUISITOS

  return (
    <div className="rounded-xl border bg-white p-5 print:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileCheck2 className="size-4 text-gobierno" />
          Status de requisitos
        </h2>
        <span className="flex items-center gap-2">
          {guardando && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              todo ? "bg-agua-50 text-agua-700" : "bg-amber-50 text-amber-700"
            )}
          >
            {completos}/{TOTAL_REQUISITOS} completos
          </span>
        </span>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {DOCUMENTOS_VERANO.map((doc) => {
          const activo = marcados.includes(doc.id)
          return (
            <label
              key={doc.id}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                activo
                  ? "border-agua/40 bg-agua-50/60"
                  : "border-transparent hover:bg-muted/40"
              )}
            >
              <Checkbox
                checked={activo}
                onCheckedChange={() => toggle(doc.id)}
                className="mt-0.5"
              />
              <span className="leading-snug text-foreground">{doc.label}</span>
            </label>
          )
        })}
      </div>

      {/* Recibo de pago — requisito especial con número */}
      <div className="mt-3 rounded-lg border border-gobierno/20 bg-gobierno-50/50 px-3 py-2.5">
        <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Receipt className="size-4 text-gobierno" />
            No. de recibo de pago
          </span>
          <Input
            value={recibo}
            onChange={(e) => setRecibo(e.target.value)}
            onBlur={guardarRecibo}
            placeholder="Captura el número de recibo"
            className="h-9 sm:max-w-xs"
          />
        </label>
      </div>

      {/* Al completar todo: abrir el expediente listo para imprimir */}
      {todo && (
        <div className="mt-3 flex flex-col items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="size-5" />
            Documentación completa. Ya puedes imprimir el expediente.
          </p>
          <Link
            href={`/imprimir-expediente/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Printer className="size-4" />
            Abrir listo para imprimir
          </Link>
        </div>
      )}
    </div>
  )
}
