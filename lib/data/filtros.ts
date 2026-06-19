import type { EstatusActivo } from "@prisma/client"

export type FiltroCatalogo = {
  q?: string
  estatus?: EstatusActivo
  page: number
  pageSize: number
}

// searchParams puede traer string o string[]; normalizamos a un filtro tipado.
export function parseFiltroCatalogo(
  searchParams: { [key: string]: string | string[] | undefined },
  pageSize = 10
): FiltroCatalogo {
  const q =
    typeof searchParams.q === "string" && searchParams.q.trim()
      ? searchParams.q.trim()
      : undefined

  const estatusRaw =
    typeof searchParams.estatus === "string" ? searchParams.estatus : undefined
  const estatus =
    estatusRaw === "activa" || estatusRaw === "inactiva"
      ? (estatusRaw as EstatusActivo)
      : undefined

  const page = Math.max(1, Number(searchParams.page) || 1)

  return { q, estatus, page, pageSize }
}
