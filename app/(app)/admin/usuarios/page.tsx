import Link from "next/link"

import { requerirRol } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { listarUsuarios } from "@/lib/data/usuarios"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { UsuariosTabla } from "@/components/admin/usuarios-tabla"
import { NuevoUsuarioButton } from "@/components/admin/nuevo-usuario-button"

export const metadata = { title: "Usuarios" }

export default async function UsuariosPage() {
  await requerirRol(["admin"])

  const [usuarios, zonas] = await Promise.all([
    listarUsuarios(),
    prisma.zona.findMany({ orderBy: { nombre: "asc" } }),
  ])

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
        descripcion="Cuentas de acceso, roles y contraseñas."
        acciones={<NuevoUsuarioButton zonas={zonas} />}
      />
      <UsuariosTabla usuarios={usuarios} zonas={zonas} />
    </div>
  )
}
