import Link from "next/link"

import { requerirRol } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui-patterns/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Zonas" }

export default async function ZonasPage() {
  await requerirRol(["admin"])

  const zonas = await prisma.zona.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { centros: true } },
      coordinadoras: { where: { rol: "zona", estatus: "activa" } },
    },
  })

  return (
    <div>
      <Link
        href="/admin"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Administración
      </Link>
      <PageHeader
        titulo="Zonas"
        descripcion="Las cuatro zonas son fijas. Aquí solo se consultan."
      />
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Zona</TableHead>
              <TableHead>Coordinadora de zona</TableHead>
              <TableHead className="text-center">Centros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zonas.map((z) => (
              <TableRow key={z.id}>
                <TableCell className="font-medium">{z.nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {z.coordinadoras.length > 0
                    ? z.coordinadoras
                        .map((c) => `${c.nombre} ${c.apellidoPaterno}`)
                        .join(", ")
                    : "Sin asignar"}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {z._count.centros}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
