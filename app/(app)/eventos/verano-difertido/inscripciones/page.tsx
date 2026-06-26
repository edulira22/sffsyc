import Link from "next/link"
import { ArrowLeft, ArrowRight, ExternalLink, Users, FileText } from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { listarInscripcionesVerano } from "@/lib/data/verano"
import { folioVerano, grupoPorId, TOTAL_DOCUMENTOS } from "@/lib/eventos/verano"
import { calcularEdad, formatoFecha } from "@/lib/fechas"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Inscripciones — Verano DIFertido" }

export default async function InscripcionesVeranoPage() {
  await requerirSesion()

  const inscripciones = await listarInscripcionesVerano()

  return (
    <div className="space-y-4">
      <Link
        href="/eventos/verano-difertido"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Verano DIFertido 2026
      </Link>

      <PageHeader
        titulo="Inscripciones"
        descripcion={`${inscripciones.length} ${
          inscripciones.length === 1 ? "niño/a inscrito" : "niños/as inscritos"
        } hasta ahora.`}
        acciones={
          <Button asChild className="gap-2 bg-agua hover:bg-agua-600">
            <a href="/verano" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Abrir formulario público
            </a>
          </Button>
        }
      />

      {inscripciones.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Aún no hay inscripciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las inscripciones capturadas en el formulario público aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Folio</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead>Inscrito</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscripciones.map((i) => {
                const grupo = i.grupo ? grupoPorId(i.grupo) : undefined
                const docs = ((i.documentos as unknown as string[]) ?? []).length
                const docsCompletos = docs === TOTAL_DOCUMENTOS
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {folioVerano(i.id)}
                    </TableCell>
                    <TableCell className="font-medium">{i.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {calcularEdad(i.fechaNacimiento)} años
                    </TableCell>
                    <TableCell>
                      {grupo ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: grupo.hex }}
                          />
                          {grupo.nombre}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.talla || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          docsCompletos
                            ? "bg-agua-50 text-agua-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {docs}/{TOTAL_DOCUMENTOS}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatoFecha(i.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/eventos/verano-difertido/inscripciones/${i.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gobierno hover:underline"
                      >
                        <FileText className="size-4" />
                        Expediente
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
