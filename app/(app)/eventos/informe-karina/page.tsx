import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Download,
  TriangleAlert,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import {
  listarRegistrosInforme,
  obtenerResumenInforme,
  type ResumenInforme,
} from "@/lib/data/informe"
import { EVENTO_INFORME, labelParentesco } from "@/lib/eventos/informe"
import { PageHeader } from "@/components/ui-patterns/page-header"
import { Button } from "@/components/ui/button"
import { LigaPublica } from "@/components/eventos/liga-publica"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const metadata = { title: "Informe de la Sra. Karina" }

function fechaCorta(d: Date) {
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function InformeKarinaPage() {
  await requerirSesion()

  const [registros, resumen] = await Promise.all([
    listarRegistrosInforme(),
    obtenerResumenInforme(),
  ])

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Inicio
      </Link>

      <PageHeader
        titulo={EVENTO_INFORME.nombre}
        descripcion="Registro de asistencia de colaboradores del DIF y sus familiares invitados."
        acciones={
          registros.length > 0 ? (
            <Button asChild variant="outline" className="gap-2">
              <a href="/api/datos/exportar?entidad=registros-informe" download>
                <Download className="size-4" />
                Exportar Excel
              </a>
            </Button>
          ) : undefined
        }
      />

      <LigaPublica
        ruta="/informe"
        descripcion="Compártela con los colaboradores. No requiere iniciar sesión y pueden agregar los familiares que necesiten."
      />

      {registros.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Aún no hay registros</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte la liga pública de arriba. Los registros y el conteo de
            asistentes aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <>
          <Totales resumen={resumen} />

          {resumen.posiblesDuplicados.length > 0 && (
            <Duplicados resumen={resumen} />
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Desglose
              titulo="Parentesco de los invitados"
              icono={UserRound}
              items={resumen.porParentesco}
              pie={`Sobre ${resumen.totalInvitados} invitados.`}
            />
            <Desglose
              titulo="Asistentes por área"
              icono={Building2}
              items={resumen.porArea.slice(0, 8)}
              pie={
                resumen.porArea.length > 8
                  ? `Colaborador + invitados. Se muestran 8 de ${resumen.porArea.length} áreas.`
                  : "Incluye al colaborador y a sus invitados."
              }
            />
          </div>

          {/* Tabla de registros */}
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                Registros ({registros.length})
              </p>
              {resumen.ultimoRegistro && (
                <p className="text-xs text-muted-foreground">
                  Último: {fechaCorta(resumen.ultimoRegistro)}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Familiares invitados</TableHead>
                    <TableHead className="text-right">Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((r) => (
                    <TableRow key={r.id} className="align-top">
                      <TableCell className="font-medium">
                        {r.colaborador}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.area}
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-1">
                          {r.invitados.map((inv, i) => (
                            <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                              <span>{inv.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {labelParentesco(inv.parentesco)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {r.invitados.length + 1} personas en total
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                        {fechaCorta(r.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// --- Totales -----------------------------------------------------------------

function Totales({ resumen }: { resumen: ResumenInforme }) {
  const tarjetas = [
    {
      icono: Users,
      valor: resumen.totalPersonas,
      etiqueta: "Asistentes en total",
      pie: "Colaboradores más sus invitados",
      color: "bg-agua-50 text-agua",
      destacada: true,
    },
    {
      icono: UserRound,
      valor: resumen.totalRegistros,
      etiqueta: "Colaboradores registrados",
      color: "bg-gobierno-50 text-gobierno",
    },
    {
      icono: UsersRound,
      valor: resumen.totalInvitados,
      etiqueta: "Familiares invitados",
      pie: `${resumen.promedioInvitados} en promedio por colaborador`,
      color: "bg-amber-50 text-amber-600",
    },
    {
      icono: Building2,
      valor: resumen.totalAreas,
      etiqueta: "Áreas representadas",
      color: "bg-purple-50 text-purple-600",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((t) => {
        const Icono = t.icono
        return (
          <div
            key={t.etiqueta}
            className={cn(
              "rounded-xl border bg-white p-4",
              t.destacada && "border-agua/30 ring-1 ring-agua/15"
            )}
          >
            <div className="mb-2.5 flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  t.color
                )}
              >
                <Icono className="size-4" />
              </div>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                {t.etiqueta}
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {t.valor}
            </p>
            {t.pie && (
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                {t.pie}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Aviso de duplicados -----------------------------------------------------

function Duplicados({ resumen }: { resumen: ResumenInforme }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Colaboradores con más de un registro
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            El formulario permite agregar varios familiares en un solo envío, así
            que un segundo registro suele ser un duplicado. El total de
            asistentes ya cuenta a cada colaborador una sola vez, pero conviene
            revisar que sus invitados no estén repetidos.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resumen.posiblesDuplicados.map((d) => (
              <span
                key={d.nombre}
                className="rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-medium text-amber-900"
              >
                {d.nombre} · {d.veces}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Desglose con barras -----------------------------------------------------

function Desglose({
  titulo,
  icono: Icono,
  items,
  pie,
}: {
  titulo: string
  icono: typeof Users
  items: ResumenInforme["porParentesco"]
  pie?: string
}) {
  const mayor = Math.max(1, ...items.map((i) => i.cuenta))

  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icono className="size-3.5" />
        {titulo}
      </p>
      <div className="space-y-2.5">
        {items.map((i) => (
          <div key={i.clave}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{i.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{i.cuenta}</span>{" "}
                <span className="text-xs">({i.pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gobierno"
                style={{ width: `${(i.cuenta / mayor) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {pie && <p className="mt-3 text-xs text-muted-foreground">{pie}</p>}
    </div>
  )
}
