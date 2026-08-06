"use client"

import { useEffect, useState } from "react"
import { Check, Copy, ExternalLink, Link2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

/**
 * Muestra la liga pública de una ruta y permite copiarla al portapapeles.
 * La URL absoluta se arma en el cliente para que funcione igual en local,
 * en preview y en producción.
 */
export function LigaPublica({
  ruta,
  descripcion,
}: {
  ruta: string
  descripcion?: string
}) {
  const [url, setUrl] = useState("")
  const [copiada, setCopiada] = useState(false)

  useEffect(() => {
    setUrl(`${window.location.origin}${ruta}`)
  }, [ruta])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiada(true)
      toast.success("Liga copiada")
      setTimeout(() => setCopiada(false), 2000)
    } catch {
      toast.error("No se pudo copiar. Copia la liga manualmente.")
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Link2 className="size-4 text-agua" />
        <p className="text-sm font-semibold text-foreground">Liga pública</p>
      </div>

      {descripcion && (
        <p className="mb-3 text-xs text-muted-foreground">{descripcion}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
          {url || `…${ruta}`}
        </code>
        <div className="flex gap-2">
          <Button
            onClick={copiar}
            disabled={!url}
            className="gap-2 bg-agua hover:bg-agua-600"
          >
            {copiada ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copiada ? "Copiada" : "Copiar"}
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href={ruta} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Abrir
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
