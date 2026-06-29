import type { InscripcionVerano } from "@prisma/client"

import { EVENTO_VERANO, folioVerano } from "@/lib/eventos/verano"
import { edadAniosMesesTexto, formatoFecha } from "@/lib/fechas"
import { aTitulo } from "@/lib/texto"
import type { AutorizadoVerano } from "@/lib/data/verano"

// Documento del expediente: réplica mejorada del formato físico (rosa), SIN
// reglamento y SIN el equipo (dato interno). Pensado para imprimirse y
// anexarse al expediente físico del NNA, con recuadro para la foto.

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
      <p className="text-[9px] font-semibold uppercase tracking-wider text-rose-400">
        {etiqueta}
      </p>
      <p className="min-h-[1.2rem] border-b border-rose-200 pb-0.5 text-sm font-medium text-slate-800">
        {valor && valor.trim() ? valor : " "}
      </p>
    </div>
  )
}

function Seccion({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-md bg-rose-500 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white evitar-corte">
      {children}
    </div>
  )
}

export function ExpedienteVerano({ insc }: { insc: InscripcionVerano }) {
  const autorizados = (insc.autorizados as unknown as AutorizadoVerano[]) ?? []
  const nom = (s?: string | null) => (s ? aTitulo(s) : "")

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-xl bg-white text-foreground print:max-w-none print:rounded-none">
      {/* Franja superior de color */}
      <div className="h-2 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />

      <div className="px-7 py-5 print:px-2 print:py-3">
        {/* Encabezado: foto + título + folio/talla */}
        <div className="flex items-stretch gap-5">
          {/* Recuadro para foto infantil (se pega físicamente) */}
          <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-rose-300 bg-rose-50/70 p-1 text-center">
            <span className="text-[9px] font-medium leading-tight text-rose-400">
              Foto infantil
              <br />
              (pegar aquí)
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">
              {EVENTO_VERANO.sede}
            </p>
            <h1 className="text-xl font-extrabold leading-tight text-rose-600">
              Inscripción — {EVENTO_VERANO.nombre}
            </h1>
            <p className="text-[11px] text-slate-500">
              Información general del niño, niña y/o adolescente (NNA)
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-rose-400">Folio</p>
              <p className="font-mono text-base font-bold text-rose-600">
                {folioVerano(insc.id)}
              </p>
            </div>
            <div className="min-w-[60px] rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-center">
              <p className="text-[8px] uppercase tracking-wider text-rose-400">Talla</p>
              <p className="text-base font-bold text-rose-600">{insc.talla || "—"}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 h-0.5 rounded bg-rose-200" />

        {/* Información general */}
        <div className="mt-3 grid grid-cols-12 gap-x-5 gap-y-2.5">
          <Dato etiqueta="Nombre del NNA" valor={nom(insc.nombre)} className="col-span-7" />
          <Dato
            etiqueta="Fecha de inscripción"
            valor={formatoFecha(insc.fechaInscripcion)}
            className="col-span-3"
          />
          <Dato
            etiqueta="¿Primera vez?"
            valor={insc.primeraVez ? "Sí" : "No"}
            className="col-span-2"
          />
          <Dato etiqueta="CURP del NNA" valor={insc.curp} className="col-span-7" />
          <Dato
            etiqueta="Fecha de nacimiento"
            valor={formatoFecha(insc.fechaNacimiento)}
            className="col-span-3"
          />
          <Dato
            etiqueta="Edad"
            valor={edadAniosMesesTexto(insc.fechaNacimiento)}
            className="col-span-2"
          />
        </div>

        {/* Padres / tutores */}
        <Seccion>Padres / Tutores — encargados legales del NNA</Seccion>
        <div className="mt-2.5 grid grid-cols-12 gap-x-5 gap-y-2.5">
          <Dato etiqueta="Padre / Tutor legal" valor={nom(insc.padre)} className="col-span-8" />
          <Dato etiqueta="Celular" valor={insc.celularPadre} className="col-span-4" />
          <Dato etiqueta="Madre / Tutora legal" valor={nom(insc.madre)} className="col-span-8" />
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
        <Seccion>Autorizados para recoger al NNA</Seccion>
        <div className="mt-2.5 space-y-2.5">
          {[0, 1, 2].map((i) => {
            const a = autorizados[i]
            return (
              <div key={i} className="grid grid-cols-12 gap-x-5">
                <Dato etiqueta={`Nombre ${i + 1}`} valor={nom(a?.nombre)} className="col-span-5" />
                <Dato etiqueta="Celular" valor={a?.celular} className="col-span-4" />
                <Dato etiqueta="Parentesco" valor={nom(a?.parentesco)} className="col-span-3" />
              </div>
            )
          })}
        </div>

        {/* Salud */}
        <Seccion>Aspectos relacionados con la salud del NNA</Seccion>
        <div className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-2.5">
          <Dato etiqueta="Enfermedades" valor={insc.enfermedades} />
          <Dato etiqueta="¿Le impide alguna actividad?" valor={insc.impideActividad} />
          <Dato etiqueta="Medicamentos (nombre, dosis, horario)" valor={insc.medicamentos} />
          <Dato etiqueta="Alergias" valor={insc.alergias} />
          <Dato etiqueta="Nombre del servicio médico" valor={nom(insc.nombreServicioMedico)} />
          <Dato etiqueta="Número de servicio médico" valor={insc.numeroServicioMedico} />
          <Dato etiqueta="Médico tratante" valor={nom(insc.nombreMedico)} />
          <Dato etiqueta="Teléfono del médico" valor={insc.telefonoMedico} />
        </div>

        {/* Recibo de pago + Firma — bloque único: nunca se cortan entre páginas */}
        <div className="evitar-corte mt-3">
          <div className="flex items-end gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
              No. de recibo de pago:
            </span>
            <span className="min-w-[140px] flex-1 border-b border-rose-200 pb-0.5 text-sm font-medium text-slate-800">
              {insc.reciboPago?.trim() ? insc.reciboPago : " "}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center print:mt-5">
            <div className="w-72 border-t border-slate-400 pt-1.5 text-center">
              <p className="text-sm font-semibold text-slate-800">{nom(insc.nombreFirma)}</p>
              <p className="text-[11px] text-slate-500">Nombre y firma del padre/tutor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
