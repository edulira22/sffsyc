"use client"

import { useState, useCallback } from "react"
import { useFieldArray, useForm, Controller } from "react-hook-form"
import { Plus, Trash2, Loader2, CheckCircle2, UserCheck, AlertCircle, Clock, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ESCOLARIDADES, ESCOLARIDAD_LABEL } from "@/lib/schemas/beneficiario"
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
    clasesCentroIds: [...clasesDefault],
  }
}

// ---- Estilos de celda (compactos, sin border en el input) -------------------

const cellCls = "border-r border-muted/40 last:border-r-0 px-1.5 py-1"
const inputCls =
  "h-7 w-full border-0 bg-transparent px-1.5 py-0 text-sm shadow-none outline-none placeholder:text-muted-foreground/50 focus:ring-0"

// ---- RegistradorMasivo (componente principal) --------------------------------

export function RegistradorMasivo({
  centroId,
  clases,
  periodoFecha,
}: {
  centroId: number
  clases: ClaseOpcion[]
  periodoFecha?: string
}) {
  const [clasesDefault, setClasesDefault] = useState<number[]>(
    clases.length === 1 ? [clases[0].id] : []
  )
  const [curpEstados, setCurpEstados] = useState<CurpEstado[]>(
    Array.from({ length: 10 }, () => ({ verificado: false }))
  )
  const [resultados, setResultados] = useState<ResultadoFila[] | null>(null)
  const [enviando, setEnviando] = useState(false)

  const { control, handleSubmit, setValue, getValues, watch } = useForm<{
    filas: FilaForm[]
  }>({
    defaultValues: {
      filas: Array.from({ length: 10 }, () => filaVacia([])),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "filas" })

  // CURP: verificar duplicado al salir del campo
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

  function agregarFilas(n: number) {
    for (let i = 0; i < n; i++) append(filaVacia(clasesDefault))
    setCurpEstados((prev) => [
      ...prev,
      ...Array.from({ length: n }, () => ({ verificado: false })),
    ])
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

  function aplicarClasesATodas() {
    fields.forEach((_, i) =>
      setValue(`filas.${i}.clasesCentroIds`, [...clasesDefault])
    )
    toast.success("Clases aplicadas a todas las filas")
  }

  async function onSubmit(data: { filas: FilaForm[] }) {
    const filasConDatos = data.filas.filter(
      (f) => f.apellidoPaterno.trim() || f.nombres.trim()
    )
    if (filasConDatos.length === 0) {
      toast.error("Llena al menos una fila antes de registrar.")
      return
    }

    const errores: string[] = []
    filasConDatos.forEach((f, i) => {
      const n = i + 1
      if (!f.apellidoPaterno.trim()) errores.push(`Fila ${n}: apellido paterno requerido`)
      if (!f.nombres.trim()) errores.push(`Fila ${n}: nombre(s) requerido`)
      if (!f.fechaNacimiento) errores.push(`Fila ${n}: fecha de nac. requerida`)
      if (!f.sinCurp && !f.curp.trim()) errores.push(`Fila ${n}: CURP requerida — marca S/C si no la tiene`)
      if (!f.sinTelefono && !f.telefono.trim()) errores.push(`Fila ${n}: teléfono requerido — marca S/T si no lo tiene`)
      if (!f.sinDomicilio && !f.domicilio.trim()) errores.push(`Fila ${n}: domicilio requerido — marca S/D si no lo tiene`)
      if (!f.escolaridad) errores.push(`Fila ${n}: escolaridad requerida`)
      if (f.clasesCentroIds.length === 0) errores.push(`Fila ${n}: selecciona al menos una clase`)
    })

    if (errores.length > 0) {
      toast.error(errores[0], {
        description:
          errores.length > 1 ? `+${errores.length - 1} campo(s) más con error` : undefined,
      })
      return
    }

    setEnviando(true)
    try {
      const r = await registrarMasivo(centroId, filasConDatos as never, periodoFecha)
      if (!r.ok) { toast.error("Error al registrar la lista."); return }
      setResultados(r.resultados)
      const ok = r.resultados.filter((x) => x.tipo !== "error").length
      const errF = r.resultados.filter((x) => x.tipo === "error").length
      if (errF === 0) {
        toast.success(`${ok} persona(s) registradas correctamente`)
      } else {
        toast.warning(`${ok} registradas · ${errF} con error`)
      }
    } finally {
      setEnviando(false)
    }
  }

  const filasConDatos = watch("filas").filter(
    (f) => f.apellidoPaterno.trim() || f.nombres.trim()
  ).length

  return (
    <div className="space-y-4">
      {/* Clases por defecto */}
      {clases.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3">
          <span className="shrink-0 text-sm font-medium text-foreground">
            Clase(s) predeterminada para la lista:
          </span>
          <div className="flex flex-wrap gap-2">
            {clases.map((c) => {
              const sel = clasesDefault.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setClasesDefault((p) =>
                      p.includes(c.id)
                        ? p.filter((id) => id !== c.id)
                        : [...p, c.id]
                    )
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
                    sel
                      ? "border-gobierno/40 bg-gobierno-50 text-gobierno"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {sel ? "✓" : "+"} {c.nombre}
                </button>
              )
            })}
          </div>
          {clasesDefault.length > 0 && (
            <button
              type="button"
              onClick={aplicarClasesATodas}
              className="ml-auto text-xs text-gobierno underline-offset-2 hover:underline"
            >
              Aplicar a toda la lista
            </button>
          )}
        </div>
      )}

      {/* Leyenda de indicadores */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-amber-400" />
          CURP ya registrada — se inscribirá al existente
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-orange-400" />
          Sin CURP declarado
        </span>
        <span>
          <strong>S/C</strong> = Sin CURP &nbsp;·&nbsp; <strong>S/T</strong> = Sin teléfono &nbsp;·&nbsp;{" "}
          <strong>S/D</strong> = Sin domicilio (aparecen al pasar el cursor)
        </span>
      </div>

      {/* Tabla */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="min-w-[1080px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="w-8 px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  #
                </th>
                <th className="min-w-[130px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Ap. Paterno <span className="text-red-400">*</span>
                </th>
                <th className="min-w-[110px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Ap. Materno
                </th>
                <th className="min-w-[120px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Nombre(s) <span className="text-red-400">*</span>
                </th>
                <th className="min-w-[175px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  CURP <span className="text-red-400">*</span>
                </th>
                <th className="w-[110px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  F. Nac. <span className="text-red-400">*</span>
                </th>
                <th className="w-12 px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Edad
                </th>
                <th className="min-w-[110px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Teléfono <span className="text-red-400">*</span>
                </th>
                <th className="min-w-[145px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Domicilio <span className="text-red-400">*</span>
                </th>
                <th className="min-w-[125px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Escolaridad <span className="text-red-400">*</span>
                </th>
                <th className="min-w-[130px] px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">
                  Clase(s) <span className="text-red-400">*</span>
                </th>
                <th className="w-8 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/30">
              {fields.map((field, index) => (
                <FilaTabla
                  key={field.id}
                  index={index}
                  control={control}
                  watch={watch}
                  clases={clases}
                  curpEstado={curpEstados[index] ?? { verificado: false }}
                  onCurpChange={() => resetCurpEstado(index)}
                  onCurpBlur={(curp) => verificarCurpFila(index, curp)}
                  onFechaAutoFill={(fecha) =>
                    setValue(`filas.${index}.fechaNacimiento`, fecha)
                  }
                  onToggleClase={(claseId) => toggleClaseFila(index, claseId)}
                  onEliminar={() => eliminarFila(index)}
                  puedeEliminar={fields.length > 1}
                  setValue={setValue}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie de página */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => agregarFilas(10)}
            >
              <Plus className="size-3.5" />
              +10 filas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => agregarFilas(5)}
            >
              <Plus className="size-3.5" />
              +5 filas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => agregarFilas(1)}
            >
              <Plus className="size-3.5" />
              +1 fila
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filasConDatos} persona{filasConDatos !== 1 ? "s" : ""} para registrar
            </span>
            <Button
              type="submit"
              disabled={enviando || filasConDatos === 0}
              className="bg-gobierno hover:bg-gobierno/90"
            >
              {enviando && <Loader2 className="mr-1 size-4 animate-spin" />}
              Registrar lista
            </Button>
          </div>
        </div>
      </form>

      {/* Resultados */}
      {resultados && <ResultadosRegistro resultados={resultados} />}
    </div>
  )
}

// ---- FilaTabla --------------------------------------------------------------

function FilaTabla({
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
  setValue,
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
  setValue: ReturnType<typeof useForm<{ filas: FilaForm[] }>>["setValue"]
}) {
  const sinCurp: boolean = watch(`filas.${index}.sinCurp`) ?? false
  const sinTelefono: boolean = watch(`filas.${index}.sinTelefono`) ?? false
  const sinDomicilio: boolean = watch(`filas.${index}.sinDomicilio`) ?? false
  const fechaNacimiento: string = watch(`filas.${index}.fechaNacimiento`) ?? ""
  const clasesCentroIds: number[] =
    (watch(`filas.${index}.clasesCentroIds`) as number[]) ?? []
  const edad = edadDeISO(fechaNacimiento)

  const nombreAp = watch(`filas.${index}.apellidoPaterno`) ?? ""
  const nombre = watch(`filas.${index}.nombres`) ?? ""
  const isEmpty = !nombreAp.trim() && !nombre.trim()

  const rowCls = cn(
    "group relative transition-colors",
    curpEstado.duplicado
      ? "bg-amber-50/50 hover:bg-amber-50"
      : sinCurp
        ? "bg-orange-50/30 hover:bg-orange-50/50"
        : isEmpty
          ? "hover:bg-muted/10"
          : "bg-white hover:bg-muted/20"
  )

  const clasesSeleccionadas = clases.filter((c) => clasesCentroIds.includes(c.id))

  return (
    <tr className={rowCls}>
      {/* Número */}
      <td className="w-8 border-r border-muted/40 pl-3 pr-1.5 py-1 text-center">
        <span className="text-[11px] font-medium text-muted-foreground/60">
          {index + 1}
        </span>
      </td>

      {/* Apellido Paterno */}
      <td className={cellCls}>
        <Controller
          control={control}
          name={`filas.${index}.apellidoPaterno`}
          render={({ field }) => (
            <input
              {...field}
              className={inputCls}
              placeholder="Apellido..."
              autoComplete="off"
            />
          )}
        />
      </td>

      {/* Apellido Materno */}
      <td className={cellCls}>
        <Controller
          control={control}
          name={`filas.${index}.apellidoMaterno`}
          render={({ field }) => (
            <input {...field} className={inputCls} placeholder="Apellido..." autoComplete="off" />
          )}
        />
      </td>

      {/* Nombre(s) */}
      <td className={cellCls}>
        <Controller
          control={control}
          name={`filas.${index}.nombres`}
          render={({ field }) => (
            <input {...field} className={inputCls} placeholder="Nombre(s)..." autoComplete="off" />
          )}
        />
      </td>

      {/* CURP */}
      <td className={cellCls}>
        {sinCurp ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
              Sin CURP
            </span>
            <button
              type="button"
              onClick={() => {
                setValue(`filas.${index}.sinCurp`, false)
                onCurpChange()
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
              title="Quitar"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Controller
              control={control}
              name={`filas.${index}.curp`}
              render={({ field }) => (
                <input
                  {...field}
                  className={cn(
                    inputCls,
                    "font-mono uppercase tracking-wider",
                    curpEstado.duplicado && "text-amber-700"
                  )}
                  placeholder="18 caracteres"
                  maxLength={18}
                  autoComplete="off"
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
                    const v = field.value ?? ""
                    if (v.length === 18) onCurpBlur(v)
                  }}
                />
              )}
            />
            <button
              type="button"
              title="Marcar sin CURP"
              onClick={() => {
                setValue(`filas.${index}.sinCurp`, true)
                setValue(`filas.${index}.curp`, "")
                onCurpChange()
              }}
              className="shrink-0 rounded px-1 text-[10px] font-semibold text-muted-foreground/0 transition-all hover:bg-orange-50 hover:text-orange-600 group-hover:text-muted-foreground/50"
            >
              S/C
            </button>
          </div>
        )}
        {curpEstado.duplicado && (
          <p className="mt-0.5 truncate text-[10px] leading-tight text-amber-600">
            ↳ {curpEstado.duplicado.nombre}
          </p>
        )}
      </td>

      {/* Fecha Nacimiento */}
      <td className={cellCls}>
        <Controller
          control={control}
          name={`filas.${index}.fechaNacimiento`}
          render={({ field }) => (
            <input
              {...field}
              type="date"
              className={cn(inputCls, "text-xs")}
            />
          )}
        />
      </td>

      {/* Edad */}
      <td className={cellCls}>
        <span className="block text-center text-sm text-muted-foreground">
          {edad !== null ? `${edad}a` : "—"}
        </span>
      </td>

      {/* Teléfono */}
      <td className={cellCls}>
        {sinTelefono ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Sin tel.
            </span>
            <button
              type="button"
              onClick={() => setValue(`filas.${index}.sinTelefono`, false)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Controller
              control={control}
              name={`filas.${index}.telefono`}
              render={({ field }) => (
                <input {...field} className={inputCls} placeholder="614..." autoComplete="off" />
              )}
            />
            <button
              type="button"
              title="Sin teléfono"
              onClick={() => {
                setValue(`filas.${index}.sinTelefono`, true)
                setValue(`filas.${index}.telefono`, "")
              }}
              className="shrink-0 rounded px-1 text-[10px] font-semibold text-muted-foreground/0 transition-all hover:bg-muted hover:text-muted-foreground group-hover:text-muted-foreground/40"
            >
              S/T
            </button>
          </div>
        )}
      </td>

      {/* Domicilio */}
      <td className={cellCls}>
        {sinDomicilio ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Sin dom.
            </span>
            <button
              type="button"
              onClick={() => setValue(`filas.${index}.sinDomicilio`, false)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Controller
              control={control}
              name={`filas.${index}.domicilio`}
              render={({ field }) => (
                <input
                  {...field}
                  className={inputCls}
                  placeholder="Calle, colonia..."
                  autoComplete="off"
                />
              )}
            />
            <button
              type="button"
              title="Sin domicilio"
              onClick={() => {
                setValue(`filas.${index}.sinDomicilio`, true)
                setValue(`filas.${index}.domicilio`, "")
              }}
              className="shrink-0 rounded px-1 text-[10px] font-semibold text-muted-foreground/0 transition-all hover:bg-muted hover:text-muted-foreground group-hover:text-muted-foreground/40"
            >
              S/D
            </button>
          </div>
        )}
      </td>

      {/* Escolaridad */}
      <td className={cellCls}>
        <Controller
          control={control}
          name={`filas.${index}.escolaridad`}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className="h-7 border-0 bg-transparent px-1.5 text-xs shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:size-3">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {ESCOLARIDADES.map((e) => (
                  <SelectItem key={e} value={e} className="text-xs">
                    {ESCOLARIDAD_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </td>

      {/* Clases */}
      <td className={cellCls}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-7 w-full items-center justify-between gap-1 rounded px-1.5 text-xs transition-colors hover:bg-muted/50",
                clasesSeleccionadas.length === 0
                  ? "text-muted-foreground/50"
                  : "text-foreground"
              )}
            >
              <span className="truncate">
                {clasesSeleccionadas.length === 0
                  ? "Seleccionar…"
                  : clasesSeleccionadas.map((c) => c.nombre).join(", ")}
              </span>
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 p-2">
            {clases.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No hay clases activas en este centro.
              </p>
            ) : (
              clases.map((c) => {
                const sel = clasesCentroIds.includes(c.id)
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Checkbox
                      checked={sel}
                      onCheckedChange={() => onToggleClase(c.id)}
                      className="size-3.5"
                    />
                    <span className="flex-1">{c.nombre}</span>
                  </label>
                )
              })
            )}
          </PopoverContent>
        </Popover>
      </td>

      {/* Eliminar */}
      <td className="w-8 px-1.5 py-1">
        <button
          type="button"
          onClick={onEliminar}
          disabled={!puedeEliminar}
          title="Eliminar fila"
          className="flex size-6 items-center justify-center rounded text-muted-foreground/0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:text-muted-foreground/40 disabled:pointer-events-none"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ---- ResultadosRegistro -----------------------------------------------------

function ResultadosRegistro({ resultados }: { resultados: ResultadoFila[] }) {
  const nuevos = resultados.filter((r) => r.tipo === "nuevo")
  const reingresos = resultados.filter((r) => r.tipo === "reingreso")
  const yaInscritos = resultados.filter((r) => r.tipo === "ya_inscrito")
  const errores = resultados.filter((r) => r.tipo === "error")

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Resultado del registro</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Chip
          icono={<CheckCircle2 className="size-4" />}
          label="Nuevos"
          count={nuevos.length}
          className="border-green-200 bg-green-50 text-green-700"
        />
        <Chip
          icono={<UserCheck className="size-4" />}
          label="Reingresos"
          count={reingresos.length}
          className="border-blue-200 bg-blue-50 text-blue-700"
        />
        <Chip
          icono={<Clock className="size-4" />}
          label="Ya registrados"
          count={yaInscritos.length}
          className="border-border bg-muted/50 text-muted-foreground"
        />
        <Chip
          icono={<AlertCircle className="size-4" />}
          label="Con error"
          count={errores.length}
          className="border-red-200 bg-red-50 text-red-700"
        />
      </div>

      {reingresos.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
          <p className="mb-1 text-xs font-semibold text-blue-700">
            Reingresos — ya existían en el sistema:
          </p>
          {reingresos.map((r) => (
            <p key={r.index} className="text-xs text-blue-600">
              • {r.nombre}
            </p>
          ))}
        </div>
      )}

      {errores.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
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

function Chip({
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
      <div className="mb-1 flex justify-center opacity-60">{icono}</div>
      <p className="text-xl font-bold">{count}</p>
      <p className="text-[11px] leading-tight">{label}</p>
    </div>
  )
}
