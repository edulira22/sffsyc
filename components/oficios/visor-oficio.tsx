"use client"

import { ExternalLink, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

/** Muestra el escaneo: imagen o PDF. `src` puede ser una URL o un object URL. */
export function VisorOficio({
  src,
  tipo,
  className,
  enlace = true,
}: {
  src: string | null
  tipo: string
  className?: string
  enlace?: boolean
}) {
  if (!src) {
    return (
      <div className={cn("flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground", className)}>
        <FileText className="mr-2 size-4" /> Sin archivo
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border bg-muted/30", className)}>
      {tipo === "application/pdf" ? (
        <iframe src={src} title="Oficio escaneado" className="h-[70vh] min-h-96 w-full bg-white" />
      ) : (
        <a href={src} target="_blank" rel="noopener noreferrer" className="block flex-1 overflow-auto" title="Abrir en tamaño completo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Oficio escaneado" className="mx-auto h-auto w-full max-w-3xl bg-white" />
        </a>
      )}
      {enlace && (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-t bg-white px-3 py-2 text-xs font-medium text-gobierno hover:bg-muted/40"
        >
          <ExternalLink className="size-3.5" /> Abrir en pestaña nueva
        </a>
      )}
    </div>
  )
}
