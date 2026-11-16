"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  NAV_INICIO,
  NAV_ADMINISTRACION,
  NAV_AREAS,
  NAV_PROFESOR_STEM,
  type AreaNav,
  type ItemSimple,
} from "@/lib/navegacion"

function estaActivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

function EnlaceSimple({
  item,
  onNavigate,
}: {
  item: ItemSimple
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const activo = estaActivo(pathname, item.href)
  const Icono = item.icono
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        activo
          ? "bg-white/15 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icono className="size-[18px] shrink-0" />
      {item.titulo}
    </Link>
  )
}

function AreaProximamente({ area }: { area: AreaNav }) {
  const Icono = area.icono
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/30 cursor-not-allowed select-none">
      <Icono className="size-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{area.titulo}</span>
      <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/40">
        Pronto
      </span>
    </div>
  )
}

function GrupoArea({
  area,
  abierto,
  alternar,
  onNavigate,
}: {
  area: AreaNav
  abierto: boolean
  alternar: () => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const areaActiva = area.modulos.some((m) => estaActivo(pathname, m.href))
  const Icono = area.icono

  return (
    <div>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
          areaActiva
            ? "text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icono className="size-[18px] shrink-0" />
        <span className="flex-1 text-left">{area.titulo}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            abierto && "rotate-180"
          )}
        />
      </button>

      {abierto && (
        <div className="mt-1 space-y-1 border-l border-white/15 pl-3 ml-4">
          {area.modulos.map((m) => {
            const activo = estaActivo(pathname, m.href)
            const IconoModulo = m.icono
            return (
              <Link
                key={m.href}
                href={m.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activo
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                )}
              >
                <IconoModulo className="size-4 shrink-0" />
                {m.titulo}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Área a la que pertenece la ruta actual (para abrirla sola). */
function areaDeRuta(pathname: string) {
  return NAV_AREAS.find((a) => a.modulos.some((m) => estaActivo(pathname, m.href)))?.id ?? null
}

export function SidebarNav({ onNavigate, soloProfesor }: { onNavigate?: () => void; soloProfesor?: boolean }) {
  const pathname = usePathname()
  // Una sola área abierta a la vez: el menú se mantiene corto.
  const [abierta, setAbierta] = useState<string | null>(() => areaDeRuta(pathname))

  useEffect(() => {
    const actual = areaDeRuta(pathname)
    if (actual) setAbierta(actual)
  }, [pathname])

  if (soloProfesor) {
    return (
      <nav className="flex flex-col gap-1">
        <EnlaceSimple item={NAV_PROFESOR_STEM} onNavigate={onNavigate} />
      </nav>
    )
  }
  return (
    <nav className="flex flex-col gap-1">
      <EnlaceSimple item={NAV_INICIO} onNavigate={onNavigate} />

      <div className="my-2 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
          Áreas
        </p>
      </div>

      {NAV_AREAS.map((area) =>
        area.proximamente ? (
          <AreaProximamente key={area.id} area={area} />
        ) : (
          <GrupoArea
            key={area.id}
            area={area}
            abierto={abierta === area.id}
            alternar={() => setAbierta(abierta === area.id ? null : area.id)}
            onNavigate={onNavigate}
          />
        )
      )}

      <div className="my-2 border-t border-white/10" />
      <EnlaceSimple item={NAV_ADMINISTRACION} onNavigate={onNavigate} />
    </nav>
  )
}
