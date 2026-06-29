import Link from "next/link"
import {
  Rocket,
  UserPlus,
  Users,
  GraduationCap,
  CalendarClock,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react"

import { requerirSesion } from "@/lib/session"
import { EVENTO_VERANO, GRUPOS_VERANO } from "@/lib/eventos/verano"
import { contarInscripcionesVerano } from "@/lib/data/verano"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { CuentaRegresiva } from "@/components/eventos/cuenta-regresiva"
import { PeriodoInscripcion } from "@/components/eventos/periodo-inscripcion"
import { cn } from "@/lib/utils"

export const metadata = { title: "Verano DIFertido 2026" }

function fechaLarga(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Accesos del evento.
const SECCIONES = [
  {
    href: "/verano",
    titulo: "Inscribir niño/a",
    descripcion: "Abre el formulario de inscripción (también es la liga pública).",
    icono: UserPlus,
    activo: true,
    externo: true,
  },
  {
    href: "/eventos/verano-difertido/inscripciones",
    titulo: "Inscripciones y expedientes",
    descripcion: "Consulta a los inscritos e imprime su expediente.",
    icono: FileText,
    activo: true,
    externo: false,
  },
  {
    href: "/eventos/verano-difertido/clases",
    titulo: "Clases y staff",
    descripcion: "Configura clases, maestros y horarios del curso.",
    icono: GraduationCap,
    activo: true,
    externo: false,
  },
]

export default async function VeranoDifertidoPage() {
  await requerirSesion()

  const [inscritos, clasesCount, staffCount] = await Promise.all([
    contarInscripcionesVerano(),
    prisma.claseVerano.count({ where: { estatus: "activa" } }),
    prisma.personalVerano.count({ where: { estatus: "activo" } }),
  ])

  return (
    <div className="space-y-6">
      {/* Hero con cuenta regresiva */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gobierno via-gobierno to-purple-900 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                <Rocket className="size-5" />
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Curso de verano
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {EVENTO_VERANO.nombre}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/75">
              <CalendarClock className="size-4" />
              {fechaLarga(EVENTO_VERANO.inicio)} — {fechaLarga(EVENTO_VERANO.fin)} ·{" "}
              {EVENTO_VERANO.sede}
            </p>
          </div>
          <div className="lg:w-[420px]">
            <CuentaRegresiva
              inicioISO={EVENTO_VERANO.inicio}
              finISO={EVENTO_VERANO.fin}
            />
          </div>
        </div>
      </div>

      {/* Aviso de la temporada de inscripciones (se oculta al cerrar) */}
      <PeriodoInscripcion
        inicioISO={EVENTO_VERANO.inscripcionInicio}
        finISO={EVENTO_VERANO.inscripcionFin}
      />

      {/* Métricas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Resumen del curso</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/eventos/verano-difertido/inscripciones" className="group">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Users className="size-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{inscritos}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    Niños inscritos
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          {[
            { icono: GraduationCap, valor: clasesCount, etiqueta: "Clases configuradas", color: "bg-purple-50 text-purple-600" },
            { icono: UserPlus, valor: staffCount, etiqueta: "Staff y maestros", color: "bg-gobierno-50 text-gobierno" },
          ].map((m, i) => {
            const Icono = m.icono
            return (
              <Link key={i} href="/eventos/verano-difertido/clases" className="group">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn("flex size-12 items-center justify-center rounded-xl", m.color)}>
                    <Icono className="size-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{m.valor}</p>
                    <p className="text-sm text-muted-foreground">{m.etiqueta}</p>
                  </div>
                </CardContent>
              </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Grupos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Equipos del curso
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GRUPOS_VERANO.map((g) => (
            <div
              key={g.id}
              className={cn("rounded-xl border p-4", g.claseCard)}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-block size-3.5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: g.hex }}
                />
                <p className="font-bold text-foreground">{g.nombre}</p>
              </div>
              <p className="text-xs font-medium text-foreground/70">{g.color}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {g.edadMin === g.edadMax
                  ? `${g.edadMin} años`
                  : `${g.edadMin}–${g.edadMax} años`}
              </p>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Salida {g.salida}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          TurboBots y Megatronix (edades 10–13) se nivelarán automáticamente: mismo
          número de integrantes, acomodando a los mayores en Megatronix.
        </p>
      </section>

      {/* Accesos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Gestión del curso</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SECCIONES.map((s) => {
            const Icono = s.icono
            const contenido = (
              <div
                className={cn(
                  "flex h-full items-start gap-3 rounded-xl border bg-white p-4 transition-all",
                  s.activo
                    ? "hover:border-gobierno/30 hover:shadow-sm"
                    : "cursor-not-allowed border-dashed bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    s.activo ? "bg-gobierno-50 text-gobierno" : "bg-muted text-muted-foreground/50"
                  )}
                >
                  <Icono className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-semibold", s.activo ? "text-foreground" : "text-muted-foreground")}>
                      {s.titulo}
                    </p>
                    {!s.activo && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                    {s.descripcion}
                  </p>
                </div>
                {s.activo && (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 mt-0.5" />
                )}
              </div>
            )
            if (!s.activo) return <div key={s.titulo}>{contenido}</div>
            return s.externo ? (
              <a
                key={s.titulo}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                {contenido}
              </a>
            ) : (
              <Link key={s.titulo} href={s.href} className="group">
                {contenido}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
