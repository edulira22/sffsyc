"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

// Pantalla de "Cargando…" mientras se abre una página. Bloquea los clics desde
// el primer instante (para que nadie mueva nada a medio cargar) y se deja ver
// tras un momento, así las páginas rápidas no parpadean. Si tarda demasiado,
// ofrece recargar para que nadie se quede atorado.

const RETRASO_VISIBLE_MS = 150
const AVISO_LENTO_MS = 20_000

export function PantallaCargando() {
  const [visible, setVisible] = useState(false)
  const [lento, setLento] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), RETRASO_VISIBLE_MS)
    const t2 = setTimeout(() => setLento(true), AVISO_LENTO_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 z-[60] flex cursor-wait items-center justify-center transition-colors duration-200 print:hidden ${
        visible ? "bg-white/50 backdrop-blur-[1px]" : "bg-transparent"
      }`}
    >
      {visible && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white px-8 py-6 shadow-lg">
          <Loader2 className="size-7 animate-spin text-agua" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Cargando…</p>
            <p className="text-xs text-muted-foreground">
              {lento ? "Está tardando más de lo normal." : "Un momento, por favor."}
            </p>
          </div>
          {lento && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer text-sm font-medium text-agua hover:underline"
            >
              Recargar la página
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Detecta clics en enlaces internos y muestra la pantalla de carga al
 * instante, antes de que el servidor responda. Se quita al cambiar la ruta.
 */
export function IndicadorNavegacion() {
  const pathname = usePathname()
  const busqueda = useSearchParams()
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setCargando(false)
  }, [pathname, busqueda])

  useEffect(() => {
    // En fase de captura: el <Link> de Next cancela el clic normal para navegar
    // por su cuenta, así que hay que verlo antes que él.
    function alClic(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return
      // Misma página (o solo un ancla): no hay nada que cargar.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      setCargando(true)
    }
    document.addEventListener("click", alClic, true)
    return () => document.removeEventListener("click", alClic, true)
  }, [])

  return cargando ? <PantallaCargando /> : null
}
