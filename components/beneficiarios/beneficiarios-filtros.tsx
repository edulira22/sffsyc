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

export function BeneficiariosFiltros({
  centros,
  clases,
}: {
  centros: { id: number; nombre: string }[]
  clases: { id: number; nombreOficial: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendiente, startTransition] = useTransition()
  const [texto, setTexto] = useState(searchParams.get("q") ?? "")

  function actualizar(cambios: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === "" || v === "todos") params.delete(k)
      else params.set(k, v)
    }
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  useEffect(() => {
    const actual = searchParams.get("q") ?? ""
    if (texto === actual) return
    const id = setTimeout(() => actualizar({ q: texto || null }), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto])

  return (
    <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre o CURP…"
          className="pl-9"
        />
        {pendiente && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={searchParams.get("centro") ?? "todos"}
          onValueChange={(v) => actualizar({ centro: v })}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Centro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los centros</SelectItem>
            {centros.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("clase") ?? "todos"}
          onValueChange={(v) => actualizar({ clase: v })}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Clase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las clases</SelectItem>
            {clases.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombreOficial}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
