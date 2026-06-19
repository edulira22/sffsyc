"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import type { Zona } from "@prisma/client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TIPO_CENTRO_LABEL, ESTATUS_CENTRO_LABEL } from "@/lib/schemas/centro"

export function CentrosFiltros({
  zonas,
}: {
  zonas?: Pick<Zona, "id" | "nombre">[]
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
          placeholder="Buscar centro por nombre…"
          className="pl-9"
        />
        {pendiente && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Select
          value={searchParams.get("tipo") ?? "todos"}
          onValueChange={(v) => actualizar({ tipo: v })}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPO_CENTRO_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("estatus") ?? "todos"}
          onValueChange={(v) => actualizar({ estatus: v })}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(ESTATUS_CENTRO_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {zonas && zonas.length > 0 && (
          <Select
            value={searchParams.get("zona") ?? "todos"}
            onValueChange={(v) => actualizar({ zona: v })}
          >
            <SelectTrigger className="col-span-2 sm:w-40">
              <SelectValue placeholder="Zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las zonas</SelectItem>
              {zonas.map((z) => (
                <SelectItem key={z.id} value={String(z.id)}>
                  {z.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
