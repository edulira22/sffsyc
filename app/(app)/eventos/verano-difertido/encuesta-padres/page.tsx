import Link from "next/link"
import {
  ArrowLeft,
  Download,
  MessagesSquare,
  Star,
  ThumbsUp,
  TrendingUp,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import {
  obtenerResultadosEncuesta,
  listarRespuestasEncuesta,
} from "@/lib/data/encuesta-padres"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LigaPublica } from "@/components/eventos/liga-publica"
import { EncuestaResultados } from "@/components/eventos/encuesta-resultados"
import { cn } from "@/lib/utils"

export const metadata = { title: "Encuesta de padres — Verano DIFertido" }

export default async function EncuestaPadresResultadosPage() {
  await requerirSesion()

  const [{ kpis, preguntas }, respuestas] = await Promise.all([
    obtenerResultadosEncuesta(),
    listarRespuestasEncuesta(),
  ])

  const tarjetas = [
    {
      icono: MessagesSquare,
      valor: String(kpis.total),
      etiqueta: "Respuestas recibidas",
      color: "bg-gobierno-50 text-gobierno",
    },
    {
      icono: TrendingUp,
      valor: kpis.satisfaccion === null ? "—" : `${kpis.satisfaccion}%`,
      etiqueta: "Satisfechos o muy satisfechos",
      color: "bg-agua-50 text-agua",
    },
    {
      icono: Star,
      valor: kpis.promedioEstrellas === null ? "—" : `${kpis.promedioEstrellas}`,
      etiqueta: "Calificación promedio (de 5)",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icono: ThumbsUp,
      valor: kpis.recomendaria === null ? "—" : `${kpis.recomendaria}%`,
      etiqueta: "Recomendaría la veraneada",
      color: "bg-purple-50 text-purple-600",
    },
  ]

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
        titulo="Encuesta de padres y tutores"
        descripcion="Resultados de la encuesta de satisfacción del cierre del curso."
        acciones={
          respuestas.length > 0 ? (
            <Button asChild variant="outline" className="gap-2">
              <a
                href="/api/datos/exportar?entidad=encuesta-padres-verano"
                download
              >
                <Download className="size-4" />
                Exportar Excel
              </a>
            </Button>
          ) : undefined
        }
      />

      <LigaPublica
        ruta="/verano/encuesta"
        descripcion="Compártela por WhatsApp con los padres. No requiere iniciar sesión y las respuestas son anónimas."
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => {
          const Icono = t.icono
          return (
            <Card key={t.etiqueta}>
              <CardContent className="flex items-center gap-3.5 p-4">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    t.color
                  )}
                >
                  <Icono className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {t.valor}
                  </p>
                  <p className="text-xs leading-tight text-muted-foreground">
                    {t.etiqueta}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {kpis.total === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <MessagesSquare className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Aún no hay respuestas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte la liga pública de arriba con los padres y tutores. Los
            resultados y las gráficas aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <EncuestaResultados preguntas={preguntas} respuestas={respuestas} />
      )}
    </div>
  )
}
