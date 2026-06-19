import { Download, FileSpreadsheet, Info } from "lucide-react"

import { requerirRol } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { ENTIDADES_EXCEL, ORDEN_ENTIDADES } from "@/lib/excel/columnas"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Importador } from "@/components/datos/importador"

export const metadata = { title: "Importar y exportar" }

async function conteos(): Promise<Record<string, number>> {
  const [coordinadoras, clases, profesores, centros, beneficiarios, inscripciones] =
    await Promise.all([
      prisma.coordinadora.count(),
      prisma.catalogoClase.count(),
      prisma.profesor.count(),
      prisma.centro.count(),
      prisma.beneficiario.count(),
      prisma.inscripcion.count(),
    ])
  return { coordinadoras, clases, profesores, centros, beneficiarios, inscripciones }
}

export default async function DatosPage() {
  await requerirRol(["admin", "coordinacion_general"])
  const totales = await conteos()

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Importar y exportar"
        descripcion="Maneja la información en Excel con un formato estándar y ordenado."
      />

      {/* Aviso de orden de carga */}
      <div className="flex gap-3 rounded-xl border border-gobierno-50 bg-gobierno-50/60 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-gobierno" />
        <div className="text-sm text-gobierno-700">
          <p className="font-semibold">Orden recomendado para importar</p>
          <p className="mt-1 text-gobierno-700/80">
            Coordinadoras → Clases → Profesores → Centros → Beneficiarios →
            Inscripciones. Cada nivel necesita que el anterior ya exista (por
            ejemplo, no puedes inscribir sin que existan centros y clases).
          </p>
        </div>
      </div>

      {/* Exportar / Plantillas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Exportar datos y descargar plantillas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ORDEN_ENTIDADES.map((id) => {
            const entidad = ENTIDADES_EXCEL[id]
            const total = totales[id] ?? 0
            return (
              <Card key={id}>
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-agua-50 text-agua">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {entidad.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {total} {total === 1 ? "registro" : "registros"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      disabled={total === 0}
                    >
                      <a
                        href={`/api/datos/exportar?entidad=${id}`}
                        aria-disabled={total === 0}
                      >
                        <Download className="size-4" />
                        Exportar ({total})
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/api/datos/exportar?entidad=${id}&plantilla=1`}>
                        Descargar plantilla
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Importar */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Importar desde Excel
        </h2>
        <Importador />
      </section>
    </div>
  )
}
