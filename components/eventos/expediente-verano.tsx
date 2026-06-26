import type { InscripcionVerano } from "@prisma/client"
import { Rocket } from "lucide-react"

import {
  EVENTO_VERANO,
  folioVerano,
  grupoPorId,
} from "@/lib/eventos/verano"
import { calcularEdad, formatoFecha } from "@/lib/fechas"
import type { AutorizadoVerano } from "@/lib/data/verano"

// Documento del expediente: réplica del formato físico (SIN reglamento).
// Pensado para verse en pantalla y para imprimirse tal cual y anexarse al
// expediente físico del NNA.

function Dato({
  etiqueta,
  valor,
  className,
}: {
  etiqueta: string
  valor?: string | null
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </p>
      <p className="min-h-[1.25rem] border-b border-dashed border-muted-foreground/30 pb-0.5 text-sm text-foreground">
        {valor && valor.trim() ? valor : "—"}
      </p>
    </div>
  )
}

function Encabezado({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 border-y border-gobierno/20 bg-gobierno-50 px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-gobierno">
      {children}
    </div>
  )
}

export function ExpedienteVerano({ insc }: { insc: InscripcionVerano }) {
  const edad = calcularEdad(insc.fechaNacimiento)
  const grupo = insc.grupo ? grupoPorId(insc.grupo) : undefined
  const autorizados = (insc.autorizados as unknown as AutorizadoVerano[]) ?? []

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-foreground print:max-w-none print:p-0 print:shadow-none">
      {/* Encabezado institucional */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-gobierno pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gobierno text-white">
            <Rocket className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-gobierno">
              Inscripción — {EVENTO_VERANO.nombre}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {EVENTO_VERANO.sede} · Información general del NNA
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Folio
          </p>
          <p className="font-mono text-sm font-bold text-gobierno">
            {folioVerano(insc.id)}
          </p>
        </div>
      </div>

      {/* Equipo + Talla */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-gobierno/20 bg-gobierno-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gobierno/70">
            Equipo
          </p>
          <p className="flex items-center gap-2 text-sm font-bold text-gobierno">
            {grupo && (
              <span
                className="inline-block size-3 rounded-full ring-1 ring-white"
                style={{ backgroundColor: grupo.hex }}
              />
            )}
            {grupo ? grupo.nombre : "Por asignar"}
          </p>
        </div>
        <div className="rounded-lg border border-gobierno/20 bg-gobierno-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gobierno/70">
            Talla
          </p>
          <p className="text-sm font-bold text-gobierno">{insc.talla || "—"}</p>
        </div>
      </div>

      {/* Información general */}
      <div className="mt-3 grid grid-cols-12 gap-x-4 gap-y-2">
        <Dato etiqueta="Nombre del NNA" valor={insc.nombre} className="col-span-8" />
        <Dato
          etiqueta="Fecha de inscripción"
          valor={formatoFecha(insc.fechaInscripcion)}
          className="col-span-4"
        />
        <Dato etiqueta="CURP del NNA" valor={insc.curp} className="col-span-8" />
        <Dato
          etiqueta="Fecha de nacimiento"
          valor={formatoFecha(insc.fechaNacimiento)}
          className="col-span-2"
        />
        <Dato etiqueta="Edad" valor={`${edad} años`} className="col-span-2" />
      </div>

      {/* Padres / tutores */}
      <Encabezado>Padres / Tutores — encargados legales del NNA</Encabezado>
      <div className="mt-2 grid grid-cols-12 gap-x-4 gap-y-2">
        <Dato etiqueta="Padre" valor={insc.padre} className="col-span-8" />
        <Dato etiqueta="Celular" valor={insc.celularPadre} className="col-span-4" />
        <Dato etiqueta="Madre" valor={insc.madre} className="col-span-8" />
        <Dato etiqueta="Celular" valor={insc.celularMadre} className="col-span-4" />
        <Dato etiqueta="Teléfono de casa" valor={insc.telefonoCasa} className="col-span-4" />
        <Dato
          etiqueta="Celular para WhatsApp"
          valor={insc.celularWhatsapp}
          className="col-span-4"
        />
        <Dato etiqueta="Domicilio" valor={insc.domicilio} className="col-span-4" />
      </div>

      {/* Autorizados */}
      <Encabezado>Autorizados para recoger al NNA</Encabezado>
      <div className="mt-2 space-y-2">
        {[0, 1, 2].map((i) => {
          const a = autorizados[i]
          return (
            <div key={i} className="grid grid-cols-12 gap-x-4">
              <Dato etiqueta={`Nombre ${i + 1}`} valor={a?.nombre} className="col-span-5" />
              <Dato etiqueta="Celular" valor={a?.celular} className="col-span-4" />
              <Dato etiqueta="Parentesco" valor={a?.parentesco} className="col-span-3" />
            </div>
          )
        })}
      </div>

      {/* Salud */}
      <Encabezado>Aspectos relacionados con la salud del NNA</Encabezado>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
        <Dato etiqueta="Enfermedades" valor={insc.enfermedades} />
        <Dato etiqueta="¿Le impide alguna actividad?" valor={insc.impideActividad} />
        <Dato etiqueta="Medicamentos (nombre, dosis, horario)" valor={insc.medicamentos} />
        <Dato etiqueta="Alergias" valor={insc.alergias} />
        <Dato etiqueta="Nombre del servicio médico" valor={insc.nombreServicioMedico} />
        <Dato etiqueta="Número de servicio médico" valor={insc.numeroServicioMedico} />
        <Dato etiqueta="Médico tratante" valor={insc.nombreMedico} />
        <Dato etiqueta="Teléfono del médico" valor={insc.telefonoMedico} />
      </div>

      {/* Firma */}
      <div className="mt-10 flex flex-col items-center">
        <div className="w-72 border-t border-foreground pt-1 text-center">
          <p className="text-sm font-medium text-foreground">{insc.nombreFirma}</p>
          <p className="text-[11px] text-muted-foreground">Nombre y firma del padre/tutor</p>
        </div>
      </div>
    </div>
  )
}
