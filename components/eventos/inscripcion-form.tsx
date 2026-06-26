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
import { fechaDesCurp, edadAniosMesesDeISO, hoyISO } from "@/lib/fechas"
import { aTitulo, soloDigitos } from "@/lib/texto"
import { ReglamentoDialog } from "@/components/eventos/reglamento-dialog"
import { crearInscripcionVerano } from "@/app/verano/actions"

// ---- Tipo del formulario ----------------------------------------------------

type Autorizado = { nombre: string; celular: string; parentesco: string }

type InscripcionForm = {
  talla: string
  nombre: string
  primeraVez: boolean | null
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
  primeraVez: null,
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
    watch,
    formState: { errors },
  } = useForm<InscripcionForm>({ defaultValues: valoresIniciales })
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState<{
    folio: string
    nombre: string
  } | null>(null)

  const fechaNac = watch("fechaNacimiento")
  const edadTexto = fechaNac ? edadAniosMesesDeISO(fechaNac) : null

  async function onSubmit(data: InscripcionForm) {
    setEnviando(true)
    try {
      const r = await crearInscripcionVerano({
        nombre: data.nombre,
        curp: data.curp,
        fechaNacimiento: data.fechaNacimiento,
        talla: data.talla,
        primeraVez: data.primeraVez === true,
        fechaInscripcion: data.fechaInscripcion || undefined,
        padre: data.padre,
        celularPadre: soloDigitos(data.celularPadre),
        madre: data.madre,
        celularMadre: soloDigitos(data.celularMadre),
        telefonoCasa: soloDigitos(data.telefonoCasa),
        celularWhatsapp: soloDigitos(data.celularWhatsapp),
        domicilio: data.domicilio,
        autorizados: data.autorizados.map((a) => ({
          ...a,
          celular: soloDigitos(a.celular),
        })),
        enfermedades: data.enfermedades,
        impideActividad: data.impideActividad,
        medicamentos: data.medicamentos,
        alergias: data.alergias,
        nombreServicioMedico: data.nombreServicioMedico,
        numeroServicioMedico: data.numeroServicioMedico,
        nombreMedico: data.nombreMedico,
        telefonoMedico: soloDigitos(data.telefonoMedico),
        nombreFirma: data.nombreFirma,
        aceptaReglamento: data.aceptaReglamento,
      })

      if (r.ok) {
        setConfirmacion({ folio: r.folio, nombre: aTitulo(data.nombre) })
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

  // Auto-corrige a formato Título al salir del campo (nombres).
  const blurTitulo = (name: keyof InscripcionForm) => (
    e: React.FocusEvent<HTMLInputElement>
  ) => setValue(name, aTitulo(e.target.value) as never)

  // Deja solo dígitos (máximo 10) al salir de un teléfono.
  const blurTelefono = (name: keyof InscripcionForm) => (
    e: React.FocusEvent<HTMLInputElement>
  ) => setValue(name, soloDigitos(e.target.value).slice(0, 10) as never)

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
  const propsTel = { inputMode: "numeric" as const, maxLength: 10, type: "tel" }

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

        {/* Talla + primera vez */}
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4 border-b border-rose-100 bg-rose-50/60 px-6 py-4">
          <div className="max-w-[160px]">
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

          <Campo etiqueta="¿Es su primera vez en el curso?" requerido>
            <Controller
              control={control}
              name="primeraVez"
              rules={{ validate: (v) => v === true || v === false }}
              render={({ field }) => (
                <div className="flex gap-2">
                  {[
                    { v: true, l: "Sí" },
                    { v: false, l: "No" },
                  ].map((o) => (
                    <button
                      key={o.l}
                      type="button"
                      onClick={() => field.onChange(o.v)}
                      className={cn(
                        "rounded-lg border px-5 py-1.5 text-sm font-medium transition-colors",
                        field.value === o.v
                          ? "border-gobierno bg-gobierno text-white"
                          : "border-input hover:bg-muted/40",
                        errors.primeraVez && field.value === null && "border-rose-400"
                      )}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              )}
            />
          </Campo>
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
                className={cn(inputSm, errClase("nombre"))}
                {...register("nombre", { required: true, onBlur: blurTitulo("nombre") })}
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
                        if (fecha) setValue("fechaNacimiento", fecha)
                      }
                    }}
                    placeholder="18 caracteres — completa la fecha de nacimiento automáticamente"
                  />
                )}
              />
            </Campo>

            <Campo etiqueta="Fecha de nacimiento" requerido className="sm:col-span-5">
              <Input
                className={cn(inputSm, errClase("fechaNacimiento"))}
                type="date"
                {...register("fechaNacimiento", { required: true })}
              />
            </Campo>
            <div className="sm:col-span-7">
              <span className="mb-1 block text-xs font-medium text-foreground">
                Edad
              </span>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-foreground">
                {edadTexto ?? (
                  <span className="text-muted-foreground">
                    Se calcula con la fecha de nacimiento
                  </span>
                )}
              </div>
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
              <Input
                className={inputSm}
                {...register("padre", { onBlur: blurTitulo("padre") })}
              />
            </Campo>
            <Campo etiqueta="Celular" className="sm:col-span-4">
              <Input
                className={inputSm}
                {...propsTel}
                {...register("celularPadre", { onBlur: blurTelefono("celularPadre") })}
              />
            </Campo>
            <Campo etiqueta="Madre" className="sm:col-span-8">
              <Input
                className={inputSm}
                {...register("madre", { onBlur: blurTitulo("madre") })}
              />
            </Campo>
            <Campo etiqueta="Celular" className="sm:col-span-4">
              <Input
                className={inputSm}
                {...propsTel}
                {...register("celularMadre", { onBlur: blurTelefono("celularMadre") })}
              />
            </Campo>
            <Campo etiqueta="Teléfono de casa" requerido className="sm:col-span-4">
              <Input
                className={cn(inputSm, errClase("telefonoCasa"))}
                {...propsTel}
                {...register("telefonoCasa", {
                  required: true,
                  pattern: /^\d{10}$/,
                  onBlur: blurTelefono("telefonoCasa"),
                })}
              />
            </Campo>
            <Campo
              etiqueta="Celular autorizado para el grupo de WhatsApp"
              requerido
              className="sm:col-span-8"
            >
              <Input
                className={cn(inputSm, errClase("celularWhatsapp"))}
                {...propsTel}
                {...register("celularWhatsapp", {
                  required: true,
                  pattern: /^\d{10}$/,
                  onBlur: blurTelefono("celularWhatsapp"),
                })}
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
          <BarraSeccion>Autorizados para recoger al NNA · opcional</BarraSeccion>
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
                    {...register(`autorizados.${i}.nombre` as const, {
                      onBlur: (e) =>
                        setValue(
                          `autorizados.${i}.nombre` as const,
                          aTitulo(e.target.value)
                        ),
                    })}
                  />
                </Campo>
                <Campo etiqueta="Celular" className="sm:col-span-4">
                  <Input
                    className={inputSm}
                    {...propsTel}
                    {...register(`autorizados.${i}.celular` as const, {
                      onBlur: (e) =>
                        setValue(
                          `autorizados.${i}.celular` as const,
                          soloDigitos(e.target.value).slice(0, 10)
                        ),
                    })}
                  />
                </Campo>
                <Campo etiqueta="Parentesco" className="sm:col-span-3">
                  <Input
                    className={inputSm}
                    {...register(`autorizados.${i}.parentesco` as const, {
                      onBlur: (e) =>
                        setValue(
                          `autorizados.${i}.parentesco` as const,
                          aTitulo(e.target.value)
                        ),
                    })}
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
              <Input
                className={inputSm}
                {...register("nombreServicioMedico", {
                  onBlur: blurTitulo("nombreServicioMedico"),
                })}
              />
            </Campo>
            <Campo etiqueta="Número de servicio médico">
              <Input className={inputSm} {...register("numeroServicioMedico")} />
            </Campo>
            <Campo etiqueta="Nombre del médico tratante">
              <Input
                className={inputSm}
                {...register("nombreMedico", { onBlur: blurTitulo("nombreMedico") })}
              />
            </Campo>
            <Campo etiqueta="Teléfono del médico">
              <Input
                className={inputSm}
                {...propsTel}
                {...register("telefonoMedico", { onBlur: blurTelefono("telefonoMedico") })}
              />
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
              className={cn(inputSm, errClase("nombreFirma"))}
              {...register("nombreFirma", {
                required: true,
                onBlur: blurTitulo("nombreFirma"),
              })}
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
