"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LogoutButton({
  className,
  withLabel = true,
}: {
  className?: string
  withLabel?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size={withLabel ? "default" : "icon"}
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="size-4" />
      {withLabel && "Cerrar sesión"}
    </Button>
  )
}
