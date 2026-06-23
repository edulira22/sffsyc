"use client"

import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { Rocket, ShieldAlert, Info, Loader2 } from "lucide-react"
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
import {
  EVENTO_VERANO,
  GRUPOS_VERANO,
  TALLAS_VERANO,
  grupoSugeridoPorEdad,
} from "@/lib/eventos/verano"

// ---- Tipo del formulario ----------------------------------------------------

type Autorizado = { nombre: string; celular: string; parentesco: string }

type InscripcionForm = {
  equipo: string
  talla: string
  nombre: string
  edad: string
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
  equipo: "",
  talla: "",
  nombre: "",
  edad: "",
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
  const { register, control, handleSubmit, reset } = useForm<InscripcionForm>({
    defaultValues: valoresIniciales,
  })
  const [enviando, setEnviando] = useState(false)

  const edadStr = useWatch({ control, name: "edad" })
  const edadNum = edadStr ? Number(edadStr) : null
  const sugerido = grupoSugeridoPorEdad(
    edadNum !== null && !Number.isNaN(edadNum) ? edadNum : null
  )

  async function onSubmit(data: InscripcionForm) {
    setEnviando(true)
    try {
      // TODO: conectar a la base de datos una vez validado el formato.
      // eslint-disable-next-line no-console
      console.log("Inscripción capturada (preview):", data)
      await new Promise((r) => setTimeout(r, 500))
      toast.success("Formato capturado correctamente (vista previa)", {
        description: "Aún no se guarda en base de datos — falta tu validación del formato.",
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
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/15">
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

        {/* Tira de Equipo + Talla */}
        <div className="grid gap-4 border-b border-rose-100 bg-rose-50/60 px-6 py-4 sm:grid-cols-[1fr_1fr_auto]">
          <Campo etiqueta="Equipo (grupo)">
            <Controller
              control={control}
              name="equipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={inputSm}>
                    <SelectValue placeholder="Asignar equipo…" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_VERANO.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: g.hex }}
                          />
                          {g.nombre}
                          <span className="text-muted-foreground">· {g.color}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Campo>
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
          {sugerido && (
            <div className="flex items-end">
              <p className="rounded-lg border border-dashed border-rose-300 bg-white px-3 py-1.5 text-xs text-muted-foreground">
                Sugerido por edad:{" "}
                <span className="font-semibold text-foreground">
                  {sugerido.nombre}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Cuerpo */}
        <div className="space-y-5 px-6 py-5">
          {/* Información general */}
          <div className="grid gap-4 sm:grid-cols-12">
            <Campo etiqueta="Nombre completo del NNA" requerido className="sm:col-span-6">
              <Input className={inputSm} {...register("nombre")} placeholder="Apellidos y nombre(s)" />
            </Campo>
            <Campo etiqueta="Edad" requerido className="sm:col-span-2">
              <Input className={inputSm} type="number" min={4} max={17} {...register("edad")} />
            </Campo>
            <Campo etiqueta="Fecha de inscripción" className="sm:col-span-4">
              <Input className={inputSm} type="date" {...register("fechaInscripcion")} />
            </Campo>
            <Campo etiqueta="CURP del NNA" className="sm:col-span-12">
              <Input
                className={cn(inputSm, "font-mono uppercase tracking-wider")}
                maxLength={18}
                {...register("curp")}
                placeholder="18 caracteres"
              />
            </Campo>
          </div>

          {/* Nota de custodia */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Si existe demanda en curso o resolución judicial a su favor (guarda y
              custodia), <strong>no escriba</strong> el nombre del padre/madre demandada
              en la siguiente sección.
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
              <Input className={inputSm} {...register("domicilio")} placeholder="Calle, número, colonia" />
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
                  <Input className={inputSm} {...register(`autorizados.${i}.nombre` as const)} />
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
            <Button type="submit" disabled={enviando} className="bg-gobierno hover:bg-gobierno/90">
              {enviando && <Loader2 className="mr-1 size-4 animate-spin" />}
              Capturar inscripción
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
