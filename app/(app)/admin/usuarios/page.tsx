import Link from "next/link"

import { requerirSesion } from "@/lib/session"
import { listarUsuarios } from "@/lib/data/usuarios"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { UsuariosTabla } from "@/components/admin/usuarios-tabla"
import { NuevoUsuarioButton } from "@/components/admin/nuevo-usuario-button"

export const metadata = { title: "Usuarios" }

export default async function UsuariosPage() {
  await requerirSesion()

  const usuarios = await listarUsuarios()

  return (
    <div>
      <Link
        href="/admin"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Administración
      </Link>
      <PageHeader
        titulo="Usuarios del sistema"
        descripcion="Cuentas de acceso y permisos por sección."
        acciones={<NuevoUsuarioButton />}
      />
      <UsuariosTabla usuarios={usuarios} />
    </div>
  )
}
