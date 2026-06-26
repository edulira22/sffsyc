"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Rocket, ShieldAlert, Loader2, CheckCircle2, Hash, Plus } from "lucide-react"
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
import { fechaDesCurp, edadDeISO, hoyISO } from "@/lib/fechas"
import { ReglamentoDialog } from "@/components/eventos/reglamento-dialog"
import { crearInscripcionVerano } from "@/app/verano/actions"

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
  opcional,
  className,
  children,
}: {
  etiqueta: string
  requerido?: boolean
  opcional?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-foreground">
        {etiqueta}
        {requerido && <span className="text-rose-500"> *</span>}
        {opcional && (
          <span className="font-normal text-muted-foreground"> (opcional)</span>
        )}
      </span>
      {children}
    </label>
  )
}

// ---- Pantalla de confirmación ----------------------------------------------

function Confirmacion({
  folio,
  nombre,
  onOtro,
}: {
  folio: string
  nombre: string
  onOtro: () => void
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="bg-gobierno px-6 py-8 text-white">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 className="size-9" />
          </div>
          <h2 className="text-xl font-bold">¡Inscripción registrada!</h2>
          <p className="mt-1 text-sm text-white/75">
            {nombre} quedó inscrito(a) en {EVENTO_VERANO.nombre}.
          </p>
        </div>
        <div className="px-6 py-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Folio de tu inscripción
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-2xl font-bold tracking-wider text-gobierno">
            <Hash className="size-5 text-gobierno/50" />
            {folio}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Guarda tu folio. El personal del DIF se pondrá en contacto por el grupo
            de WhatsApp con los detalles del curso.
          </p>
          <Button
            onClick={onOtro}
            className="mt-6 w-full gap-2 bg-gobierno hover:bg-gobierno/90"
          >
            <Plus className="size-4" />
            Inscribir a otro niño/a
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Formulario -------------------------------------------------------------

export function InscripcionForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InscripcionForm>({ defaultValues: valoresIniciales })
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState<{
    folio: string
    nombre: string
  } | null>(null)

  async function onSubmit(data: InscripcionForm) {
    setEnviando(true)
    try {
      const r = await crearInscripcionVerano({
        nombre: data.nombre,
        curp: data.curp,
        fechaNacimiento: data.fechaNacimiento,
        talla: data.talla,
        fechaInscripcion: data.fechaInscripcion || undefined,
        padre: data.padre,
        celularPadre: data.celularPadre,
        madre: data.madre,
        celularMadre: data.celularMadre,
        telefonoCasa: data.telefonoCasa,
        celularWhatsapp: data.celularWhatsapp,
        domicilio: data.domicilio,
        autorizados: data.autorizados,
        enfermedades: data.enfermedades,
        impideActividad: data.impideActividad,
        medicamentos: data.medicamentos,
        alergias: data.alergias,
        nombreServicioMedico: data.nombreServicioMedico,
        numeroServicioMedico: data.numeroServicioMedico,
        nombreMedico: data.nombreMedico,
        telefonoMedico: data.telefonoMedico,
        nombreFirma: data.nombreFirma,
        aceptaReglamento: data.aceptaReglamento,
      })

      if (r.ok) {
        setConfirmacion({ folio: r.folio, nombre: data.nombre })
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        toast.error(r.error)
      }
    } finally {
      setEnviando(false)
    }
  }

  function inscribirOtro() {
    reset(valoresIniciales)
    setConfirmacion(null)
  }

  // Borde rojo en los campos obligatorios sin llenar.
  const errClase = (k: keyof InscripcionForm) =>
    errors[k] ? "border-rose-400" : ""

  if (confirmacion) {
    return (
      <Confirmacion
        folio={confirmacion.folio}
        nombre={confirmacion.nombre}
        onOtro={inscribirOtro}
      />
    )
  }

  const inputSm = "h-9"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        {/* Encabezado institucional */}
        <div className="bg-gobierno px-6 py-5 text-white">
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
        </div>

        {/* Talla */}
        <div className="flex flex-wrap items-end gap-6 border-b border-rose-100 bg-rose-50/60 px-6 py-4">
          <div className="max-w-[180px]">
            <Campo etiqueta="Talla de playera" requerido>
              <Controller
                control={control}
                name="talla"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(inputSm, errClase("talla"))}>
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
                className={cn(inputSm, errors.nombre && "border-rose-400")}
                {...register("nombre", { required: true })}
                placeholder="Apellidos y nombre(s)"
              />
            </Campo>
            <Campo etiqueta="Fecha de inscripción" requerido className="sm:col-span-4">
              <Input
                className={cn(inputSm, errClase("fechaInscripcion"))}
                type="date"
                {...register("fechaInscripcion", { required: true })}
              />
            </Campo>

            {/* CURP con auto-llenado */}
            <Campo etiqueta="CURP del NNA" requerido className="sm:col-span-12">
              <Controller
                control={control}
                name="curp"
                rules={{ required: true }}
                render={({ field }) => (
                  <Input
                    className={cn(
                      inputSm,
                      "font-mono uppercase tracking-wider",
                      errClase("curp")
                    )}
                    maxLength={18}
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase()
                      field.onChange(val)
                      if (val.length >= 10) {
                        const fecha = fechaDesCurp(val)
                        if (fecha) {
                          setValue("fechaNacimiento", fecha)
                          const edad = edadDeISO(fecha)
                          if (edad !== null) setValue("edad", String(edad))
                        }
                      }
                    }}
                    placeholder="18 caracteres — completa fecha de nacimiento y edad automáticamente"
                  />
                )}
              />
            </Campo>

            <Campo etiqueta="Fecha de nacimiento" requerido className="sm:col-span-5">
              <Input
                className={cn(inputSm, errors.fechaNacimiento && "border-rose-400")}
                type="date"
                {...register("fechaNacimiento", { required: true })}
              />
            </Campo>
            <Campo etiqueta="Edad (años)" requerido className="sm:col-span-2">
              <Input
                className={cn(inputSm, errClase("edad"))}
                type="number"
                min={4}
                max={17}
                {...register("edad", { required: true })}
              />
            </Campo>
            <div className="flex items-end pb-1 sm:col-span-5">
              <p className="text-[11px] leading-snug text-muted-foreground">
                La CURP completa estos campos automáticamente. Puedes corregirlos
                manualmente si es necesario.
              </p>
            </div>
          </div>

          {/* Nota de custodia */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Si existe demanda en curso o resolución judicial a su favor (guarda y
              custodia), <strong>no escriba</strong> el nombre del padre/madre
              demandada en la siguiente sección.
            </p>
          </div>

          {/* Padres / Tutores */}
          <BarraSeccion>Padres / Tutores — encargados legales del NNA</BarraSeccion>
          <p className="-mt-1 text-xs text-muted-foreground">
            Captura al menos a un tutor. Si por una situación de custodia no debes
            escribir a alguno de los padres, deja ese par de campos en blanco.
          </p>
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
            <Campo etiqueta="Teléfono de casa" requerido className="sm:col-span-4">
              <Input
                className={cn(inputSm, errClase("telefonoCasa"))}
                type="tel"
                {...register("telefonoCasa", { required: true })}
              />
            </Campo>
            <Campo
              etiqueta="Celular autorizado para el grupo de WhatsApp"
              requerido
              className="sm:col-span-8"
            >
              <Input
                className={cn(inputSm, errClase("celularWhatsapp"))}
                type="tel"
                {...register("celularWhatsapp", { required: true })}
              />
            </Campo>
            <Campo etiqueta="Domicilio" requerido className="sm:col-span-12">
              <Input
                className={cn(inputSm, errClase("domicilio"))}
                {...register("domicilio", { required: true })}
                placeholder="Calle, número, colonia"
              />
            </Campo>
          </div>

          {/* Autorizados para recoger */}
          <BarraSeccion>
            Autorizados para recoger al NNA · opcional
          </BarraSeccion>
          <p className="-mt-1 text-center text-xs text-muted-foreground">
            Personas que pueden recoger al NNA si los padres/tutores no pueden.
            Puedes dejarlo en blanco.
          </p>
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
          <BarraSeccion>Aspectos de salud del NNA · opcional</BarraSeccion>
          <p className="-mt-1 text-center text-xs text-muted-foreground">
            Llena solo lo que aplique. Si el NNA está sano o no usas estos
            servicios, puedes dejarlo en blanco.
          </p>
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

          {/* Reglamento — solo aceptación + link a la ventana */}
          <BarraSeccion>Reglamento</BarraSeccion>
          <div
            className={cn(
              "rounded-lg border px-4 py-3 transition-colors",
              errors.aceptaReglamento
                ? "border-rose-300 bg-rose-50"
                : "border-rose-100 bg-rose-50/40"
            )}
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
              <Controller
                control={control}
                name="aceptaReglamento"
                rules={{ required: true }}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
              <span>
                He leído y acepto el reglamento del curso.{" "}
                <span className="font-normal text-muted-foreground">
                  (<ReglamentoDialog />)
                </span>
              </span>
            </label>
            {errors.aceptaReglamento && (
              <p className="mt-1.5 pl-8 text-xs text-rose-600">
                Debes aceptar el reglamento para continuar.
              </p>
            )}
          </div>

          <Campo etiqueta="Nombre del padre / tutor que inscribe" requerido>
            <Input
              className={cn(inputSm, errors.nombreFirma && "border-rose-400")}
              {...register("nombreFirma", { required: true })}
            />
          </Campo>
        </div>

        {/* Pie */}
        <div className="flex items-center justify-end gap-2 border-t border-rose-100 bg-rose-50/60 px-6 py-4">
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
            Guardar inscripción
          </Button>
        </div>
      </div>
    </form>
  )
}
