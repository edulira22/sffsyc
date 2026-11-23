"use client"

import { useState } from "react"
import { Images, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { extensionArchivo } from "@/lib/entregas/catalogos"
import { Button } from "@/components/ui/button"

type Escaneo = { id: number; folio: string }

/**
 * Baja en un ZIP los escaneos de las solicitudes que se ven en la lista, cada uno
 * nombrado con su folio (DYP-001.jpg…). Se arma en el navegador, uno por uno con
 * la ruta de siempre, así no hay límite de tamaño del servidor.
 */
export function DescargarEscaneos({ escaneos, nombreZip }: { escaneos: Escaneo[]; nombreZip: string }) {
  const [avance, setAvance] = useState<number | null>(null)

  async function descargar() {
    if (escaneos.length === 0) return
    setAvance(0)
    try {
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      const fallidos: string[] = []
      for (let i = 0; i < escaneos.length; i++) {
        const e = escaneos[i]
        try {
          const r = await fetch(`/api/entregas/${e.id}/archivo`, { cache: "no-store" })
          if (!r.ok) throw new Error(String(r.status))
          const datos = await r.arrayBuffer()
          zip.file(`${e.folio}.${extensionArchivo(r.headers.get("Content-Type") ?? "")}`, datos)
        } catch {
          fallidos.push(e.folio)
        }
        setAvance(i + 1)
      }
      if (fallidos.length === escaneos.length) throw new Error("ninguno")
      // Las fotos y PDF ya vienen comprimidos: se guardan tal cual, más rápido.
      const contenido = await zip.generateAsync({ type: "blob", compression: "STORE" })
      const url = URL.createObjectURL(contenido)
      const a = document.createElement("a")
      a.href = url
      a.download = `${nombreZip}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      if (fallidos.length) toast.error(`No se pudieron bajar: ${fallidos.join(", ")}`)
      else toast.success(`${escaneos.length} ${escaneos.length === 1 ? "escaneo descargado" : "escaneos descargados"}.`)
    } catch {
      toast.error("No se pudieron descargar los escaneos. Intenta de nuevo.")
    } finally {
      setAvance(null)
    }
  }

  const bajando = avance !== null
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={bajando || escaneos.length === 0}
      onClick={descargar}
      title="Baja un ZIP con las imágenes de la lista, cada una con su folio"
    >
      {bajando ? <Loader2 className="size-3.5 animate-spin" /> : <Images className="size-3.5" />}
      {bajando ? `Descargando ${avance} de ${escaneos.length}…` : `Descargar escaneos (${escaneos.length})`}
    </Button>
  )
}
