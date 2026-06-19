"use client"

import { signOut } from "next-auth/react"
import { LogOut, ChevronDown } from "lucide-react"
import type { RolUsuario } from "@prisma/client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NOMBRE_ROL } from "@/lib/permisos"

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function UserMenu({
  nombre,
  rol,
  email,
}: {
  nombre: string
  rol: RolUsuario
  email: string | null
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-muted">
        <Avatar className="size-8">
          <AvatarFallback className="bg-gobierno text-xs font-semibold text-white">
            {iniciales(nombre)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-foreground">
            {nombre}
          </p>
          <p className="text-xs leading-tight text-muted-foreground">
            {NOMBRE_ROL[rol]}
          </p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium">{nombre}</p>
          {email && (
            <p className="text-xs font-normal text-muted-foreground">{email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
