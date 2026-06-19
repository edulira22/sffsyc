"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Barra de búsqueda + filtro de estatus que sincroniza con la URL (?q=&estatus=).
// La página (Server Component) lee esos parámetros y consulta la base de datos.
export function ListToolbar({
  placeholder = "Buscar…",
  conFiltroEstatus = true,
  etiquetaActivo = "Activos",
  etiquetaInactivo = "Inactivos",
  valorActivo = "activa",
  valorInactivo = "inactiva",
}: {
  placeholder?: string
  conFiltroEstatus?: boolean
  etiquetaActivo?: string
  etiquetaInactivo?: string
  valorActivo?: string
  valorInactivo?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendiente, startTransition] = useTransition()
  const [texto, setTexto] = useState(searchParams.get("q") ?? "")

  function actualizar(cambios: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === "") params.delete(clave)
      else params.set(clave, valor)
    }
    params.delete("page") // cualquier filtro reinicia la paginación
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Búsqueda con debounce.
  useEffect(() => {
    const actual = searchParams.get("q") ?? ""
    if (texto === actual) return
    const id = setTimeout(() => actualizar({ q: texto || null }), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto])

  const estatusActual = searchParams.get("estatus") ?? "todos"

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
        {pendiente && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {conFiltroEstatus && (
        <Select
          value={estatusActual}
          onValueChange={(v) => actualizar({ estatus: v === "todos" ? null : v })}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value={valorActivo}>{etiquetaActivo}</SelectItem>
            <SelectItem value={valorInactivo}>{etiquetaInactivo}</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
