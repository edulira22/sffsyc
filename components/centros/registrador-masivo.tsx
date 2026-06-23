"use client"

import { useState, useCallback } from "react"
import { useFieldArray, useForm, Controller } from "react-hook-form"
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  OctagonMinus,
  CheckCircle2,
  UserCheck,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ESCOLARIDADES, ESCOLARIDAD_LABEL, aplicaGradoEscuela } from "@/lib/schemas/beneficiario"
import { fechaDesCurp, edadDeISO } from "@/lib/fechas"
import {
  verificarCurp,
  registrarMasivo,
  type ResultadoFila,
} from "@/app/(app)/centros/[id]/beneficiarios/registrar/actions"

// ---- Types ------------------------------------------------------------------

export type ClaseOpcion = {
  id: number
  nombre: string
  categoria: string
}

type CurpEstado = {
  verificado: boolean
  duplicado?: { id: number; nombre: string }
}

type FilaForm = {
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  fechaNacimiento: string
  curp: string
  sinCurp: boolean
  telefono: string
  sinTelefono: boolean
  domicilio: string
  sinDomicilio: boolean
  escolaridad: string
  gradoEscolar: string
  nombreEscuela: string
  observaciones: string
  clasesCentroIds: number[]
}

function filaVacia(clasesDefault: number[]): FilaForm {
  return {
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombres: "",
    fechaNacimiento: "",
    curp: "",
    sinCurp: false,
    telefono: "",
    sinTelefono: false,
    domicilio: "",
    sinDomicilio: false,
    escolaridad: "",
    gradoEscolar: "",
    nombreEscuela: "",
    observaciones: "",
    clasesCentroIds: [...clasesDefault],
  }
}

// ---- RegistradorMasivo ------------------------------------------------------

export function RegistradorMasivo({
  centroId,
  clases,
}: {
  centroId: number
  clases: ClaseOpcion[]
}) {
  const [clasesDefault, setClasesDefault] = useState<number[]>(
    clases.length === 1 ? [clases[0].id] : []
  )
  const [curpEstados, setCurpEstados] = useState<CurpEstado[]>([
    { verificado: false },
    { verificado: false },
    { verificado: false },
  ])
  const [resultados, setResultados] = useState<ResultadoFila[] | null>(null)
  const [enviando, setEnviando] = useState(false)

  const { control, handleSubmit, setValue, getValues, watch } = useForm<{
    filas: FilaForm[]
  }>({
    defaultValues: {
      filas: [filaVacia([]), filaVacia([]), filaVacia([])],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "filas" })

  // CURP: verificar duplicado en blur
  const verificarCurpFila = useCallback(async (index: number, curp: string) => {
    if (!curp || curp.length !== 18) return
    const r = await verificarCurp(curp)
    setCurpEstados((prev) => {
      const next = [...prev]
      next[index] = {
        verificado: true,
        duplicado: r.existe ? r.beneficiario : undefined,
      }
      return next
    })
  }, [])

  function resetCurpEstado(index: number) {
    setCurpEstados((prev) => {
      const next = [...prev]
      next[index] = { verificado: false }
      return next
    })
  }

  function agregarFila() {
    append(filaVacia(clasesDefault))
    setCurpEstados((prev) => [...prev, { verificado: false }])
  }

  function eliminarFila(index: number) {
    if (fields.length === 1) return
    remove(index)
    setCurpEstados((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleClaseFila(index: number, claseId: number) {
    const current = getValues(`filas.${index}.clasesCentroIds`)
    setValue(
      `filas.${index}.clasesCentroIds`,
      current.includes(claseId)
        ? current.filter((id) => id !== claseId)
        : [...current, claseId]
    )
  }

  function toggleClaseDefault(claseId: number) {
    setClasesDefault((prev) =>
      prev.includes(claseId) ? prev.filter((id) => id !== claseId) : [...prev, claseId]
    )
  }

  async function onSubmit(data: { filas: FilaForm[] }) {
    // Filtrar filas con datos
    const filasConDatos = data.filas.filter(
      (f) => f.apellidoPaterno.trim() || f.nombres.trim()
    )
    if (filasConDatos.length === 0) {
      toast.error("Agrega al menos una persona antes de registrar.")
      return
    }

    // Validación básica en cliente
    const errores: string[] = []
    filasConDatos.forEach((f, i) => {
      const n = i + 1
      if (!f.nombres.trim()) errores.push(`Fila ${n}: nombre requerido`)
      if (!f.apellidoPaterno.trim()) errores.push(`Fila ${n}: apellido paterno requerido`)
      if (!f.fechaNacimiento) errores.push(`Fila ${n}: fecha de nacimiento requerida`)
      if (!f.sinCurp && !f.curp.trim()) errores.push(`Fila ${n}: CURP requerida o marca "Sin CURP"`)
      if (!f.sinTelefono && !f.telefono.trim()) errores.push(`Fila ${n}: teléfono requerido o marca "Sin tel."`)
      if (!f.sinDomicilio && !f.domicilio.trim()) errores.push(`Fila ${n}: domicilio requerido o marca "Sin dom."`)
      if (!f.escolaridad) errores.push(`Fila ${n}: escolaridad requerida`)
      if (f.clasesCentroIds.length === 0) errores.push(`Fila ${n}: selecciona al menos una clase`)
    })

    if (errores.length > 0) {
      toast.error(errores[0], {
        description: errores.length > 1 ? `+${errores.length - 1} campo(s) más con error` : undefined,
      })
      return
    }

    setEnviando(true)
    try {
      const r = await registrarMasivo(centroId, filasConDatos as never)
      if (!r.ok) {
        toast.error("No se pudo completar el registro.")
        return
      }
      setResultados(r.resultados)
      const creados = r.resultados.filter((x) => x.tipo === "creado").length
      const inscritos = r.resultados.filter((x) => x.tipo === "inscrito").length
      const errF = r.resultados.filter((x) => x.tipo === "error").length
      if (errF === 0) {
        toast.success(`${creados + inscritos} persona(s) registradas correctamente`)
      } else {
        toast.warning(
          `${creados + inscritos} registradas · ${errF} con error`
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  const filasLlenas = watch("filas").filter(
    (f) => f.apellidoPaterno.trim() || f.nombres.trim()
  ).length

  return (
    <div className="space-y-5">
      {/* Clase(s) por defecto */}
      {clases.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-sm font-semibold text-foreground">
            Clase(s) por defecto
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Se pre-seleccionarán en las nuevas filas que agregues.
          </p>
          <div className="flex flex-wrap gap-2">
            {clases.map((c) => {
              const sel = clasesDefault.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClaseDefault(c.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    sel
                      ? "border-gobierno/40 bg-gobierno-50 font-medium text-gobierno"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {c.nombre}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    {c.categoria}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filas */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <FilaRegistro
            key={field.id}
            index={index}
            control={control}
            watch={watch}
            clases={clases}
            curpEstado={curpEstados[index] ?? { verificado: false }}
            onCurpChange={() => resetCurpEstado(index)}
            onCurpBlur={(curp) => verificarCurpFila(index, curp)}
            onFechaAutoFill={(fecha) => setValue(`filas.${index}.fechaNacimiento`, fecha)}
            onToggleClase={(claseId) => toggleClaseFila(index, claseId)}
            onEliminar={() => eliminarFila(index)}
            puedeEliminar={fields.length > 1}
          />
        ))}

        {/* Pie de formulario */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={agregarFila}>
            <Plus className="size-4" />
            Agregar persona
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filasLlenas} de {fields.length} fila(s) con datos
            </span>
            <Button
              type="submit"
              disabled={enviando || filasLlenas === 0}
              className="bg-agua hover:bg-agua-600"
            >
              {enviando && <Loader2 className="size-4 animate-spin" />}
              Registrar {filasLlenas > 0 ? filasLlenas : ""} persona
              {filasLlenas !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </form>

      {/* Resultados */}
      {resultados && <ResultadosRegistro resultados={resultados} />}
    </div>
  )
}

// ---- FilaRegistro -----------------------------------------------------------

function FilaRegistro({
  index,
  control,
  watch,
  clases,
  curpEstado,
  onCurpChange,
  onCurpBlur,
  onFechaAutoFill,
  onToggleClase,
  onEliminar,
  puedeEliminar,
}: {
  index: number
  control: ReturnType<typeof useForm<{ filas: FilaForm[] }>>["control"]
  watch: ReturnType<typeof useForm<{ filas: FilaForm[] }>>["watch"]
  clases: ClaseOpcion[]
  curpEstado: CurpEstado
  onCurpChange: () => void
  onCurpBlur: (curp: string) => void
  onFechaAutoFill: (fecha: string) => void
  onToggleClase: (claseId: number) => void
  onEliminar: () => void
  puedeEliminar: boolean
}) {
  const sinCurp = watch(`filas.${index}.sinCurp`)
  const sinTelefono = watch(`filas.${index}.sinTelefono`)
  const sinDomicilio = watch(`filas.${index}.sinDomicilio`)
  const fechaNacimiento = watch(`filas.${index}.fechaNacimiento`)
  const escolaridad = watch(`filas.${index}.escolaridad`)
  const clasesCentroIds: number[] = (watch(`filas.${index}.clasesCentroIds`) as number[]) ?? []
  const edad = edadDeISO(fechaNacimiento)
  const aplicaGE = aplicaGradoEscuela(escolaridad || undefined)

  return (
    <Card
      className={cn(
        "border transition-colors",
        curpEstado.duplicado && "border-amber-300 bg-amber-50/20"
      )}
    >
      <CardContent className="p-4">
        {/* Encabezado de fila */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gobierno/10 text-xs font-bold text-gobierno">
              {index + 1}
            </span>
            {curpEstado.duplicado && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-400 bg-amber-50 text-amber-700 text-xs"
              >
                <AlertCircle className="size-3" />
                Ya existe: {curpEstado.duplicado.nombre} — se inscribirá directamente
              </Badge>
            )}
            {sinCurp && !curpEstado.duplicado && (
              <Badge
                variant="outline"
                className="gap-1 border-orange-400 bg-orange-50 text-orange-700 text-xs"
              >
                <OctagonMinus className="size-3" />
                Sin CURP
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEliminar}
            disabled={!puedeEliminar}
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Nombre */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Campo label="Apellido Paterno *">
              <Controller
                control={control}
                name={`filas.${index}.apellidoPaterno`}
                render={({ field }) => (
                  <Input {...field} placeholder="González" />
                )}
              />
            </Campo>
            <Campo label="Apellido Materno">
              <Controller
                control={control}
                name={`filas.${index}.apellidoMaterno`}
                render={({ field }) => (
                  <Input {...field} placeholder="López" />
                )}
              />
            </Campo>
            <Campo label="Nombre(s) *">
              <Controller
                control={control}
                name={`filas.${index}.nombres`}
                render={({ field }) => (
                  <Input {...field} placeholder="María José" />
                )}
              />
            </Campo>
          </div>

          {/* CURP + Fecha + Edad */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-xs font-medium">
                  {sinCurp ? "CURP (omitida)" : "CURP *"}
                </Label>
                <Controller
                  control={control}
                  name={`filas.${index}.sinCurp`}
                  render={({ field }) => (
                    <label className="flex cursor-pointer select-none items-center gap-1 text-[11px] text-orange-600">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v: boolean | "indeterminate") => {
                          field.onChange(v)
                          if (v === true) onCurpChange()
                        }}
                        className="size-3 rounded-sm"
                      />
                      Sin CURP
                    </label>
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`filas.${index}.curp`}
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={sinCurp}
                    placeholder={sinCurp ? "—" : "18 caracteres"}
                    maxLength={18}
                    className={cn(
                      "font-mono text-sm uppercase tracking-wider",
                      sinCurp && "bg-muted text-muted-foreground"
                    )}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase()
                      field.onChange(val)
                      onCurpChange()
                      if (val.length >= 10) {
                        const fecha = fechaDesCurp(val)
                        if (fecha) onFechaAutoFill(fecha)
                      }
                    }}
                    onBlur={() => {
                      field.onBlur()
                      if (field.value && field.value.length === 18) {
                        onCurpBlur(field.value)
                      }
                    }}
                  />
                )}
              />
            </div>
            <Campo label="Fecha de Nacimiento *">
              <Controller
                control={control}
                name={`filas.${index}.fechaNacimiento`}
                render={({ field }) => (
                  <Input {...field} type="date" />
                )}
              />
            </Campo>
            <div>
              <Label className="text-xs font-medium">Edad</Label>
              <div className="mt-1 flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                {edad !== null ? `${edad} años` : "—"}
              </div>
            </div>
          </div>

          {/* Teléfono + Domicilio */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-xs font-medium">
                  {sinTelefono ? "Teléfono (no proporcionado)" : "Teléfono *"}
                </Label>
                <Controller
                  control={control}
                  name={`filas.${index}.sinTelefono`}
                  render={({ field }) => (
                    <label className="flex cursor-pointer select-none items-center gap-1 text-[11px] text-muted-foreground">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="size-3 rounded-sm"
                      />
                      Sin tel.
                    </label>
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`filas.${index}.telefono`}
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={sinTelefono}
                    placeholder={sinTelefono ? "—" : "614 000 0000"}
                    className={cn(sinTelefono && "bg-muted text-muted-foreground")}
                  />
                )}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-xs font-medium">
                  {sinDomicilio ? "Domicilio (no proporcionado)" : "Domicilio *"}
                </Label>
                <Controller
                  control={control}
                  name={`filas.${index}.sinDomicilio`}
                  render={({ field }) => (
                    <label className="flex cursor-pointer select-none items-center gap-1 text-[11px] text-muted-foreground">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="size-3 rounded-sm"
                      />
                      Sin dom.
                    </label>
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`filas.${index}.domicilio`}
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={sinDomicilio}
                    placeholder={sinDomicilio ? "—" : "Calle, colonia, número..."}
                    className={cn(sinDomicilio && "bg-muted text-muted-foreground")}
                  />
                )}
              />
            </div>
          </div>

          {/* Escolaridad */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Campo label="Escolaridad *">
              <Controller
                control={control}
                name={`filas.${index}.escolaridad`}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCOLARIDADES.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESCOLARIDAD_LABEL[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Campo>
            {aplicaGE && (
              <>
                <Campo label="Grado">
                  <Controller
                    control={control}
                    name={`filas.${index}.gradoEscolar`}
                    render={({ field }) => (
                      <Input {...field} placeholder="Ej. 3° primaria" />
                    )}
                  />
                </Campo>
                <Campo label="Escuela">
                  <Controller
                    control={control}
                    name={`filas.${index}.nombreEscuela`}
                    render={({ field }) => (
                      <Input {...field} placeholder="Nombre de la escuela" />
                    )}
                  />
                </Campo>
              </>
            )}
          </div>

          {/* Clase(s) */}
          <div>
            <Label className="text-xs font-medium">Clase(s) a inscribir *</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {clases.map((c) => {
                const sel = clasesCentroIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggleClase(c.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                      sel
                        ? "border-gobierno/40 bg-gobierno-50 font-medium text-gobierno"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    {c.nombre}
                  </button>
                )
              })}
              {clases.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Este centro no tiene clases activas asignadas.
                </p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <Campo label="Observaciones">
            <Controller
              control={control}
              name={`filas.${index}.observaciones`}
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="resize-none text-sm"
                />
              )}
            />
          </Campo>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Campo helper -----------------------------------------------------------

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium">{label}</Label>
      {children}
    </div>
  )
}

// ---- ResultadosRegistro -----------------------------------------------------

function ResultadosRegistro({ resultados }: { resultados: ResultadoFila[] }) {
  const creados = resultados.filter((r) => r.tipo === "creado")
  const inscritos = resultados.filter((r) => r.tipo === "inscrito")
  const yaInscritos = resultados.filter((r) => r.tipo === "ya_inscrito")
  const errores = resultados.filter((r) => r.tipo === "error")

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Resultado del registro</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ChipResultado
          icono={<CheckCircle2 className="size-4" />}
          label="Nuevos"
          count={creados.length}
          className="bg-green-50 border-green-200 text-green-700"
        />
        <ChipResultado
          icono={<UserCheck className="size-4" />}
          label="Ya existían"
          count={inscritos.length}
          className="bg-blue-50 border-blue-200 text-blue-700"
        />
        <ChipResultado
          icono={<Clock className="size-4" />}
          label="Ya inscritos"
          count={yaInscritos.length}
          className="bg-muted/60 border-border text-muted-foreground"
        />
        <ChipResultado
          icono={<AlertCircle className="size-4" />}
          label="Con error"
          count={errores.length}
          className="bg-red-50 border-red-200 text-red-700"
        />
      </div>

      {inscritos.length > 0 && (
        <div className="rounded-lg bg-blue-50/50 border border-blue-200 p-3">
          <p className="mb-1 text-xs font-semibold text-blue-700">
            Inscritos (ya existían en el sistema)
          </p>
          {inscritos.map((r) => (
            <p key={r.index} className="text-xs text-blue-600">
              • {r.nombre}
            </p>
          ))}
        </div>
      )}

      {errores.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="mb-1 text-xs font-semibold text-red-700">Errores</p>
          {errores.map((r) => (
            <p key={r.index} className="text-xs text-red-600">
              • {r.nombre}: {r.detalle}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function ChipResultado({
  icono,
  label,
  count,
  className,
}: {
  icono: React.ReactNode
  label: string
  count: number
  className: string
}) {
  return (
    <div className={cn("rounded-lg border p-3 text-center", className)}>
      <div className="mb-1 flex justify-center opacity-70">{icono}</div>
      <p className="text-xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
