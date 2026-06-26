"use client"

import { useState, useTransition } from "react"
import { FileCheck2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { DOCUMENTOS_VERANO, TOTAL_DOCUMENTOS } from "@/lib/eventos/verano"
import { actualizarDocumentosVerano } from "@/app/(app)/eventos/verano-difertido/inscripciones/actions"

// Panel de status de documentos (solo pantalla, no se imprime). Marca lo que
// el NNA ya entregó y lo guarda en la base de datos al instante.
export function StatusDocumentos({
  id,
  inicial,
}: {
  id: number
  inicial: string[]
}) {
  const [marcados, setMarcados] = useState<string[]>(inicial)
  const [guardando, startTransition] = useTransition()

  function toggle(docId: string) {
    const nuevos = marcados.includes(docId)
      ? marcados.filter((d) => d !== docId)
      : [...marcados, docId]
    setMarcados(nuevos)
    startTransition(async () => {
      const r = await actualizarDocumentosVerano(id, nuevos)
      if (!r.ok) {
        toast.error(r.error)
        setMarcados(marcados) // revertir
      }
    })
  }

  const completos = marcados.length
  const todo = completos === TOTAL_DOCUMENTOS

  return (
    <div className="rounded-xl border bg-white p-5 print:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileCheck2 className="size-4 text-gobierno" />
          Status de documentos
        </h2>
        <span className="flex items-center gap-2">
          {guardando && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              todo
                ? "bg-agua-50 text-agua-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {completos}/{TOTAL_DOCUMENTOS} entregados
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
    </div>
  )
}
