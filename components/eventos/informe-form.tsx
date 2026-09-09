"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  EVENTO_INFORME,
  MAX_INVITADOS,
  PARENTESCOS_INFORME,
} from "@/lib/eventos/informe"
import {
  registroInformeSchema,
  invitadoVacio,
  VALORES_INICIALES_INFORME,
  type RegistroInformeInput,
} from "@/lib/schemas/informe"
import { registrarAsistenciaInforme } from "@/app/informe/actions"

type ErroresInvitado = { nombre?: string; parentesco?: string }
type Errores = {
  colaborador?: string
  area?: string
  invitados?: Record<number, ErroresInvitado>
}

export function InformeForm() {
  const [valores, setValores] = useState<RegistroInformeInput>(
    VALORES_INICIALES_INFORME
  )
  const [errores, setErrores] = useState<Errores>({})
  const [enviado, setEnviado] = useState(false)
  const [pendiente, iniciar] = useTransition()

  const invitados = valores.invitados
  const alTope = invitados.length >= MAX_INVITADOS

  function setCampo(campo: "colaborador" | "area", v: string) {
    setValores((prev) => ({ ...prev, [campo]: v }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  function setInvitado(i: number, campo: keyof ErroresInvitado, v: string) {
    setValores((prev) => ({
      ...prev,
      invitados: prev.invitados.map((inv, idx) =>
        idx === i ? { ...inv, [campo]: v } : inv
      ),
    }))
    setErrores((prev) => ({
      ...prev,
      invitados: { ...prev.invitados, [i]: { ...prev.invitados?.[i], [campo]: undefined } },
    }))
  }

  function agregarInvitado() {
    if (alTope) return
    setValores((prev) => ({
      ...prev,
      invitados: [...prev.invitados, invitadoVacio()],
    }))
  }

  function quitarInvitado(i: number) {
    setValores((prev) => ({
      ...prev,
      invitados: prev.invitados.filter((_, idx) => idx !== i),
    }))
    // Los errores por índice dejan de corresponder al quitar uno.
    setErrores((prev) => ({ ...prev, invitados: undefined }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = registroInformeSchema.safeParse(valores)
    if (!parsed.success) {
      const nuevos: Errores = { invitados: {} }
      for (const issue of parsed.error.issues) {
        const [raiz, idx, campo] = issue.path
        if (raiz === "colaborador" && !nuevos.colaborador) {
          nuevos.colaborador = issue.message
        } else if (raiz === "area" && !nuevos.area) {
          nuevos.area = issue.message
        } else if (raiz === "invitados" && typeof idx === "number") {
          const c = campo as keyof ErroresInvitado
          nuevos.invitados = {
            ...nuevos.invitados,
            [idx]: { ...nuevos.invitados?.[idx], [c]: issue.message },
          }
        }
      }
      setErrores(nuevos)
      toast.error("Faltan datos por completar")
      return
    }

    iniciar(async () => {
      const r = await registrarAsistenciaInforme(parsed.data)
      if (r.ok) {
        setEnviado(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        toast.error(r.error)
      }
    })
  }

  if (enviado) return <Confirmacion total={invitados.length} />

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="rounded-lg border border-border bg-white">
        {/* Datos del colaborador */}
        <div className="space-y-6 p-5 sm:p-7">
          <Campo
            id="colaborador"
            etiqueta="Nombre completo del colaborador"
            valor={valores.colaborador}
            onChange={(v) => setCampo("colaborador", v)}
            error={errores.colaborador}
            autoComplete="name"
          />
          <Campo
            id="area"
            etiqueta="Área, departamento o centro de trabajo"
            valor={valores.area}
            onChange={(v) => setCampo("area", v)}
            error={errores.area}
            autoComplete="organization"
          />
        </div>

        {/* Familiares invitados */}
        <div className="border-t border-border p-5 sm:p-7">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-foreground">
              Familiares invitados
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Los invitados deben ser familiares del colaborador. Puedes agregar
              los que necesites.
            </p>
          </div>

          <div className="space-y-3">
            {invitados.map((inv, i) => (
              <BloqueInvitado
                key={i}
                indice={i}
                invitado={inv}
                errores={errores.invitados?.[i]}
                puedeQuitar={invitados.length > 1}
                onChange={(campo, v) => setInvitado(i, campo, v)}
                onQuitar={() => quitarInvitado(i)}
              />
            ))}
          </div>

          {alTope ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Llegaste al máximo de {MAX_INVITADOS} familiares por registro.
            </p>
          ) : (
            <button
              type="button"
              onClick={agregarInvitado}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gobierno/35 px-4 py-3.5 text-sm font-medium text-gobierno transition-colors hover:border-gobierno/60 hover:bg-gobierno/[0.03]"
            >
              <Plus className="size-4" />
              Agregar otro familiar
            </button>
          )}
        </div>

        {/* Envío */}
        <div className="border-t border-border p-5 sm:px-7">
          <p className="mb-3 text-center text-sm text-foreground">
            Asistirán{" "}
            <span className="font-semibold">{invitados.length + 1} personas</span>
            <span className="text-muted-foreground">
              {" "}
              — tú y {invitados.length}{" "}
              {invitados.length === 1 ? "familiar" : "familiares"}
            </span>
          </p>
          <Button
            type="submit"
            disabled={pendiente}
            className="w-full gap-2 bg-gobierno py-6 text-base font-medium hover:bg-gobierno/90"
          >
            {pendiente ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar registro"
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Todos los campos son obligatorios.
          </p>
        </div>
      </div>
    </form>
  )
}

// --- Bloque de un familiar ---------------------------------------------------

function BloqueInvitado({
  indice,
  invitado,
  errores,
  puedeQuitar,
  onChange,
  onQuitar,
}: {
  indice: number
  invitado: { nombre: string; parentesco: string }
  errores?: ErroresInvitado
  puedeQuitar: boolean
  onChange: (campo: "nombre" | "parentesco", v: string) => void
  onQuitar: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Familiar {indice + 1}
        </span>
        {puedeQuitar && (
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar familiar ${indice + 1}`}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="size-3.5" />
            Quitar
          </button>
        )}
      </div>

      <label
        htmlFor={`invitado-${indice}`}
        className="block text-sm font-medium text-foreground"
      >
        Nombre completo
      </label>
      <Input
        id={`invitado-${indice}`}
        value={invitado.nombre}
        onChange={(e) => onChange("nombre", e.target.value)}
        maxLength={120}
        aria-invalid={!!errores?.nombre}
        className={cn(
          "mt-2 h-12 bg-white text-[15px]",
          errores?.nombre && "border-red-400 focus-visible:ring-red-400"
        )}
      />
      {errores?.nombre && (
        <p className="mt-1.5 text-xs text-red-600">{errores.nombre}</p>
      )}

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">
          Parentesco con el colaborador
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PARENTESCOS_INFORME.map((p) => {
            const activo = invitado.parentesco === p.valor
            return (
              <button
                key={p.valor}
                type="button"
                onClick={() => onChange("parentesco", p.valor)}
                aria-pressed={activo}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-colors",
                  activo
                    ? "border-gobierno bg-gobierno font-medium text-white"
                    : "border-input bg-white text-foreground hover:border-gobierno/40"
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        {errores?.parentesco && (
          <p className="mt-1.5 text-xs text-red-600">{errores.parentesco}</p>
        )}
      </fieldset>
    </div>
  )
}

// --- Campo de texto ----------------------------------------------------------

function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  error,
  autoComplete,
}: {
  id: string
  etiqueta: string
  valor: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {etiqueta}
      </label>
      <Input
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        maxLength={120}
        aria-invalid={!!error}
        className={cn(
          "mt-2 h-12 text-[15px]",
          error && "border-red-400 focus-visible:ring-red-400"
        )}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// --- Confirmación ------------------------------------------------------------

function Confirmacion({ total }: { total: number }) {
  return (
    <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gobierno/[0.06]">
        <Check className="size-7 text-gobierno" strokeWidth={2.5} />
      </div>
      <p className="text-lg font-semibold text-foreground">Registro completado</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {EVENTO_INFORME.confirmacion}
      </p>
      <p className="mt-4 text-sm text-foreground">
        Quedaron registradas{" "}
        <span className="font-semibold">{total + 1} personas</span>.
      </p>
      <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
        {EVENTO_INFORME.institucion}
      </p>
    </div>
  )
}
