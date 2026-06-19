"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Paginación simple sincronizada con la URL (?page=).
export function PaginationNav({
  page,
  totalPages,
  total,
}: {
  page: number
  totalPages: number
  total: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function irA(nuevaPagina: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nuevaPagina <= 1) params.delete("page")
    else params.set("page", String(nuevaPagina))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (total === 0) return null

  // Una sola página: solo mostramos el conteo, sin botones.
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        {total} {total === 1 ? "registro" : "registros"}
      </p>
    )
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "registro" : "registros"} · página {page} de{" "}
        {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => irA(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => irA(page + 1)}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
