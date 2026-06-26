import type { InscripcionVerano } from "@prisma/client"

import {
  EVENTO_VERANO,
  folioVerano,
  grupoPorId,
  DOCUMENTOS_VERANO,
} from "@/lib/eventos/verano"
import { edadAniosMesesTexto, formatoFecha } from "@/lib/fechas"
import { aTitulo } from "@/lib/texto"
import type { AutorizadoVerano } from "@/lib/data/verano"

// Documento del expediente: réplica del formato físico (rosa), SIN reglamento.
// Pensado para imprimirse y anexarse al expediente físico del NNA. Lleva un
// recuadro para pegar la foto infantil de forma física.

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
      <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-700/70">
        {etiqueta}
      </p>
      <p className="min-h-[1.25rem] border-b border-dotted border-rose-300 pb-0.5 text-sm text-foreground">
        {valor && valor.trim() ? valor : " "}
      </p>
    </div>
  )
}

function Encabezado({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-rose-100 px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-rose-800">
      {children}
    </div>
  )
}

export function ExpedienteVerano({ insc }: { insc: InscripcionVerano }) {
  const grupo = insc.grupo ? grupoPorId(insc.grupo) : undefined
  const autorizados = (insc.autorizados as unknown as AutorizadoVerano[]) ?? []
  const documentos = (insc.documentos as unknown as string[]) ?? []
  const nom = (s?: string | null) => (s ? aTitulo(s) : "")

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-foreground print:max-w-none print:p-0">
      {/* Encabezado: foto + título + folio/equipo/talla */}
      <div className="flex items-stretch gap-4 border-b-2 border-rose-400 pb-3">
        {/* Recuadro para foto infantil (se pega físicamente) */}
        <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded border-2 border-dashed border-rose-300 bg-rose-50 p-1 text-center">
          <span className="text-[9px] font-medium leading-tight text-rose-400">
            Foto infantil
            <br />
            (pegar aquí)
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-500">
            {EVENTO_VERANO.sede}
          </p>
          <h1 className="text-lg font-bold leading-tight text-rose-700">
            Inscripción — {EVENTO_VERANO.nombre}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Información general del niño, niña y/o adolescente (NNA)
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1 text-right">
          <div>
            <p className="text-[9px] uppercase tracking-wide text-rose-500">Folio</p>
            <p className="font-mono text-sm font-bold text-rose-700">
              {folioVerano(insc.id)}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded border border-rose-300 px-2 py-0.5 text-center">
              <p className="text-[8px] uppercase tracking-wide text-rose-500">Equipo</p>
              <p className="flex items-center gap-1 text-xs font-bold text-rose-700">
                {grupo && (
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: grupo.hex }}
                  />
                )}
                {grupo ? grupo.nombre : "—"}
              </p>
            </div>
            <div className="rounded border border-rose-300 px-2 py-0.5 text-center">
              <p className="text-[8px] uppercase tracking-wide text-rose-500">Talla</p>
              <p className="text-xs font-bold text-rose-700">{insc.talla || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información general */}
      <div className="mt-3 grid grid-cols-12 gap-x-4 gap-y-2">
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
      <Encabezado>Padres / Tutores — encargados legales del NNA</Encabezado>
      <div className="mt-2 grid grid-cols-12 gap-x-4 gap-y-2">
        <Dato etiqueta="Padre" valor={nom(insc.padre)} className="col-span-8" />
        <Dato etiqueta="Celular" valor={insc.celularPadre} className="col-span-4" />
        <Dato etiqueta="Madre" valor={nom(insc.madre)} className="col-span-8" />
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
              <Dato etiqueta={`Nombre ${i + 1}`} valor={nom(a?.nombre)} className="col-span-5" />
              <Dato etiqueta="Celular" valor={a?.celular} className="col-span-4" />
              <Dato etiqueta="Parentesco" valor={nom(a?.parentesco)} className="col-span-3" />
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
        <Dato etiqueta="Nombre del servicio médico" valor={nom(insc.nombreServicioMedico)} />
        <Dato etiqueta="Número de servicio médico" valor={insc.numeroServicioMedico} />
        <Dato etiqueta="Médico tratante" valor={nom(insc.nombreMedico)} />
        <Dato etiqueta="Teléfono del médico" valor={insc.telefonoMedico} />
      </div>

      {/* Checklist de documentos — refleja el status guardado */}
      <Encabezado>Documentos entregados</Encabezado>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 evitar-corte">
        {DOCUMENTOS_VERANO.map((doc) => {
          const entregado = documentos.includes(doc.id)
          return (
            <div key={doc.id} className="flex items-start gap-2 text-[11px] text-foreground">
              <span
                className={`mt-px flex size-3 shrink-0 items-center justify-center border ${
                  entregado ? "border-rose-500 bg-rose-500 text-white" : "border-rose-400"
                }`}
              >
                {entregado && (
                  <svg viewBox="0 0 10 10" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1.5 5.5L4 8l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="leading-snug">{doc.label}</span>
            </div>
          )
        })}
      </div>

      {/* Firma */}
      <div className="mt-10 flex flex-col items-center evitar-corte print:mt-6">
        <div className="w-72 border-t border-foreground pt-1 text-center">
          <p className="text-sm font-medium text-foreground">{nom(insc.nombreFirma)}</p>
          <p className="text-[11px] text-muted-foreground">Nombre y firma del padre/tutor</p>
        </div>
      </div>
    </div>
  )
}
