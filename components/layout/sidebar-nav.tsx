"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import type { RolUsuario } from "@prisma/client"

import { cn } from "@/lib/utils"
import {
  NAV_INICIO,
  NAV_ADMINISTRACION,
  NAV_AREAS,
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
      <span className="flex-1">{area.titulo}</span>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/40">
        Próximamente
      </span>
    </div>
  )
}

function GrupoArea({
  area,
  rol,
  onNavigate,
}: {
  area: AreaNav
  rol: RolUsuario
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const modulos = area.modulos.filter((m) => !m.visible || m.visible(rol))
  const areaActiva = modulos.some((m) => estaActivo(pathname, m.href))

  const [abierto, setAbierto] = useState(areaActiva)

  useEffect(() => {
    if (areaActiva) setAbierto(true)
  }, [areaActiva])

  const Icono = area.icono

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
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
          {modulos.map((m) => {
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

export function SidebarNav({
  rol,
  areasPermitidas,
  onNavigate,
}: {
  rol: RolUsuario
  areasPermitidas: string[]
  onNavigate?: () => void
}) {
  const areasVisibles = NAV_AREAS.filter((a) => {
    if (!a.visible(rol)) return false
    if (rol === "admin") return true
    if (areasPermitidas.length === 0) return true
    return areasPermitidas.includes(a.id)
  })

  return (
    <nav className="flex flex-col gap-1">
      {NAV_INICIO.visible(rol) && (
        <EnlaceSimple item={NAV_INICIO} onNavigate={onNavigate} />
      )}

      {areasVisibles.length > 0 && (
        <div className="my-2 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Áreas
          </p>
        </div>
      )}

      {areasVisibles.map((area) =>
        area.proximamente ? (
          <AreaProximamente key={area.id} area={area} />
        ) : (
          <GrupoArea key={area.id} area={area} rol={rol} onNavigate={onNavigate} />
        )
      )}

      {NAV_ADMINISTRACION.visible(rol) && (
        <>
          <div className="my-2 border-t border-white/10" />
          <EnlaceSimple item={NAV_ADMINISTRACION} onNavigate={onNavigate} />
        </>
      )}
    </nav>
  )
}
