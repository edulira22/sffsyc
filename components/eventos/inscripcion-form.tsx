"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Rocket, ShieldAlert, Info, Loader2, Hash } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { EVENTO_VERANO, TALLAS_VERANO } from "@/lib/eventos/verano"
import { fechaDesCurp } from "@/lib/fechas"

// ---- Folio provisional (se reemplazará por folio secuencial de la BD) -------

function generarFolio(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `VD26-${s}`
}

function calcularEdad(fechaNac: string): number | null {
  const nac = new Date(`${fechaNac}T12:00:00`)
  if (isNaN(nac.getTime())) return null
  const hoy = new Date()
  const edad = Math.floor(
    (hoy.getTime() - nac.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )
  return edad >= 0 && edad <= 17 ? edad : null
}

// ---- Tipo del formulario ----------------------------------------------------

type Autorizado = { nombre: string; celular: string; parentesco: string }

type InscripcionForm = {
  talla: string
  nombre: string
  edad: string
  fechaNacimiento: string
  fechaInscripcion: string
  curp: string
  padre: string
  celularPadre: string
  madre: string
  celularMadre: string
  telefonoCasa: string
  celularWhatsapp: string
  domicilio: string
  autorizados: Autorizado[]
  enfermedades: string
  impideActividad: string
  medicamentos: string
  alergias: string
  nombreServicioMedico: string
  numeroServicioMedico: string
  nombreMedico: string
  telefonoMedico: string
  aceptaReglamento: boolean
  nombreFirma: string
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

const valoresIniciales: InscripcionForm = {
  talla: "",
  nombre: "",
  edad: "",
  fechaNacimiento: "",
  fechaInscripcion: hoyISO(),
  curp: "",
  padre: "",
  celularPadre: "",
  madre: "",
  celularMadre: "",
  telefonoCasa: "",
  celularWhatsapp: "",
  domicilio: "",
  autorizados: [
    { nombre: "", celular: "", parentesco: "" },
    { nombre: "", celular: "", parentesco: "" },
    { nombre: "", celular: "", parentesco: "" },
  ],
  enfermedades: "",
  impideActividad: "",
  medicamentos: "",
  alergias: "",
  nombreServicioMedico: "",
  numeroServicioMedico: "",
  nombreMedico: "",
  telefonoMedico: "",
  aceptaReglamento: false,
  nombreFirma: "",
}

// ---- Subcomponentes de presentación ----------------------------------------

function BarraSeccion({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 flex items-center gap-3">
      <span className="h-px flex-1 bg-rose-200" />
      <span className="text-center text-[11px] font-bold uppercase tracking-wider text-rose-700">
        {children}
      </span>
      <span className="h-px flex-1 bg-rose-200" />
    </div>
  )
}

function Campo({
  etiqueta,
  requerido,
  className,
  children,
}: {
  etiqueta: string
  requerido?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-foreground">
        {etiqueta}
        {requerido && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  )
}

// ---- Formulario -------------------------------------------------------------

export function InscripcionForm() {
  const [folio] = useState(generarFolio)
  const { register, control, handleSubmit, reset, setValue } =
    useForm<InscripcionForm>({ defaultValues: valoresIniciales })
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(data: InscripcionForm) {
    setEnviando(true)
    try {
      // eslint-disable-next-line no-console
      console.log("Inscripción capturada (preview):", { folio, ...data })
      await new Promise((r) => setTimeout(r, 500))
      toast.success("Formato capturado correctamente (vista previa)", {
        description:
          "Aún no se guarda en base de datos — falta tu validación del formato.",
      })
    } finally {
      setEnviando(false)
    }
  }

  const inputSm = "h-9"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        {/* Encabezado institucional */}
        <div className="bg-gobierno px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Rocket className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  {EVENTO_VERANO.sede}
                </p>
                <h2 className="text-lg font-bold leading-tight">
                  Inscripción — {EVENTO_VERANO.nombre}
                </h2>
                <p className="text-xs text-white/70">
                  Información general del niño, niña y/o adolescente (NNA)
                </p>
              </div>
            </div>
            {/* Folio provisional */}
            <div className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-right">
              <p className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider text-white/60">
                <Hash className="size-3" />
                Folio
              </p>
              <p className="font-mono text-sm font-bold tracking-wider text-white">
                {folio}
              </p>
              <p className="text-[9px] text-white/40">provisional</p>
            </div>
          </div>
        </div>

        {/* Tira de Talla + aviso de equipo automático */}
        <div className="flex flex-wrap items-end gap-6 border-b border-rose-100 bg-rose-50/60 px-6 py-4">
          <div className="max-w-[180px]">
            <Campo etiqueta="Talla de playera">
              <Controller
                control={control}
                name="talla"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={inputSm}>
                      <SelectValue placeholder="Talla…" />
                    </SelectTrigger>
                    <SelectContent>
                      {TALLAS_VERANO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Campo>
          </div>
          <p className="flex items-center gap-1.5 pb-1 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-blue-400" />
            El equipo (grupo) se asigna automáticamente por el sistema según la edad del NNA.
          </p>
        </div>

        {/* Cuerpo */}
        <div className="space-y-5 px-6 py-5">
          {/* Información general */}
          <div className="grid gap-4 sm:grid-cols-12">
            <Campo
              etiqueta="Nombre completo del NNA"
              requerido
              className="sm:col-span-8"
            >
              <Input
                className={inputSm}
                {...register("nombre")}
                placeholder="Apellidos y nombre(s)"
              />
            </Campo>
            <Campo etiqueta="Fecha de inscripción" className="sm:col-span-4">
              <Input className={inputSm} type="date" {...register("fechaInscripcion")} />
            </Campo>

            {/* CURP con auto-llenado */}
            <Campo etiqueta="CURP del NNA" requerido className="sm:col-span-12">
              <Controller
                control={control}
                name="curp"
                render={({ field }) => (
                  <Input
                    className={cn(inputSm, "font-mono uppercase tracking-wider")}
                    maxLength={18}
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase()
                      field.onChange(val)
                      if (val.length >= 10) {
                        const fecha = fechaDesCurp(val)
                        if (fecha) {
                          setValue("fechaNacimiento", fecha)
                          const edad = calcularEdad(fecha)
                          if (edad !== null) setValue("edad", String(edad))
                        }
                      }
                    }}
                    placeholder="18 caracteres — completa fecha de nacimiento y edad automáticamente"
                  />
                )}
              />
            </Campo>

            <Campo etiqueta="Fecha de nacimiento" className="sm:col-span-5">
              <Input className={inputSm} type="date" {...register("fechaNacimiento")} />
            </Campo>
            <Campo etiqueta="Edad (años)" requerido className="sm:col-span-2">
              <Input
                className={inputSm}
                type="number"
                min={4}
                max={17}
                {...register("edad")}
              />
            </Campo>
            <div className="flex items-end pb-1 sm:col-span-5">
              <p className="text-[11px] leading-snug text-muted-foreground">
                La CURP completa estos campos automáticamente.
                Puedes corregirlos manualmente si es necesario.
              </p>
            </div>
          </div>

          {/* Nota de custodia */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Si existe demanda en curso o resolución judicial a su favor (guarda y
              custodia),{" "}
              <strong>no escriba</strong> el nombre del padre/madre demandada en la
              siguiente sección.
            </p>
          </div>

          {/* Padres / Tutores */}
          <BarraSeccion>Padres / Tutores — encargados legales del NNA</BarraSeccion>
          <div className="grid gap-4 sm:grid-cols-12">
            <Campo etiqueta="Padre" className="sm:col-span-8">
              <Input className={inputSm} {...register("padre")} />
            </Campo>
            <Campo etiqueta="Celular" className="sm:col-span-4">
              <Input className={inputSm} type="tel" {...register("celularPadre")} />
            </Campo>
            <Campo etiqueta="Madre" className="sm:col-span-8">
              <Input className={inputSm} {...register("madre")} />
            </Campo>
            <Campo etiqueta="Celular" className="sm:col-span-4">
              <Input className={inputSm} type="tel" {...register("celularMadre")} />
            </Campo>
            <Campo etiqueta="Teléfono de casa" className="sm:col-span-4">
              <Input className={inputSm} type="tel" {...register("telefonoCasa")} />
            </Campo>
            <Campo
              etiqueta="Celular autorizado para el grupo de WhatsApp"
              className="sm:col-span-8"
            >
              <Input className={inputSm} type="tel" {...register("celularWhatsapp")} />
            </Campo>
            <Campo etiqueta="Domicilio" className="sm:col-span-12">
              <Input
                className={inputSm}
                {...register("domicilio")}
                placeholder="Calle, número, colonia"
              />
            </Campo>
          </div>

          {/* Autorizados para recoger */}
          <BarraSeccion>
            Autorizados para recoger al NNA (si los padres/tutores no pueden)
          </BarraSeccion>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-12">
                <Campo etiqueta={`Nombre ${i + 1}`} className="sm:col-span-5">
                  <Input
                    className={inputSm}
                    {...register(`autorizados.${i}.nombre` as const)}
                  />
                </Campo>
                <Campo etiqueta="Celular" className="sm:col-span-4">
                  <Input
                    className={inputSm}
                    type="tel"
                    {...register(`autorizados.${i}.celular` as const)}
                  />
                </Campo>
                <Campo etiqueta="Parentesco" className="sm:col-span-3">
                  <Input
                    className={inputSm}
                    {...register(`autorizados.${i}.parentesco` as const)}
                  />
                </Campo>
              </div>
            ))}
          </div>

          {/* Salud */}
          <BarraSeccion>Aspectos relacionados con la salud del NNA</BarraSeccion>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Enfermedades (especifique)">
              <Textarea rows={2} {...register("enfermedades")} />
            </Campo>
            <Campo etiqueta="¿Le impide realizar alguna actividad/clase? ¿Cuál?">
              <Textarea rows={2} {...register("impideActividad")} />
            </Campo>
            <Campo etiqueta="Medicamentos (nombre, dosis y horario)">
              <Textarea rows={2} {...register("medicamentos")} />
            </Campo>
            <Campo etiqueta="Alergias de cualquier tipo (especifique)">
              <Textarea rows={2} {...register("alergias")} />
            </Campo>
            <Campo etiqueta="Nombre del servicio médico">
              <Input className={inputSm} {...register("nombreServicioMedico")} />
            </Campo>
            <Campo etiqueta="Número de servicio médico">
              <Input className={inputSm} {...register("numeroServicioMedico")} />
            </Campo>
            <Campo etiqueta="Nombre del médico tratante">
              <Input className={inputSm} {...register("nombreMedico")} />
            </Campo>
            <Campo etiqueta="Teléfono del médico">
              <Input className={inputSm} type="tel" {...register("telefonoMedico")} />
            </Campo>
          </div>

          {/* Reglamento */}
          <BarraSeccion>Reglamento</BarraSeccion>
          <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-rose-400" />
              <p>
                Entrada a las {EVENTO_VERANO.horaEntrada}. Salida escalonada por equipo:
                Botzitos 1:30 pm · Robotines, Botix y TurboBots 2:15 pm · Megatronix
                2:30 pm. El padre/tutor se compromete a cumplir el reglamento completo
                del curso.
              </p>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <Controller
                control={control}
                name="aceptaReglamento"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
              He leído y acepto el reglamento del curso.
            </label>
          </div>

          <Campo etiqueta="Nombre del padre / tutor que inscribe" requerido>
            <Input className={inputSm} {...register("nombreFirma")} />
          </Campo>
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between gap-3 border-t border-rose-100 bg-rose-50/60 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-rose-600">Vista previa de validación.</span>{" "}
            Aún no se guarda en base de datos.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(valoresIniciales)}
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              disabled={enviando}
              className="bg-gobierno hover:bg-gobierno/90"
            >
              {enviando && <Loader2 className="mr-1 size-4 animate-spin" />}
              Capturar inscripción
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
