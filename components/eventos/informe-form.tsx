"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { EVENTO_INFORME, PARENTESCOS_INFORME } from "@/lib/eventos/informe"
import {
  registroInformeSchema,
  VALORES_INICIALES_INFORME,
  type RegistroInformeInput,
} from "@/lib/schemas/informe"
import { registrarAsistenciaInforme } from "@/app/informe/actions"

export function InformeForm() {
  const [valores, setValores] = useState<RegistroInformeInput>(
    VALORES_INICIALES_INFORME
  )
  const [errores, setErrores] = useState<Partial<Record<keyof RegistroInformeInput, string>>>({})
  const [enviado, setEnviado] = useState(false)
  const [pendiente, iniciar] = useTransition()

  const set = (campo: keyof RegistroInformeInput, v: string) => {
    setValores((prev) => ({ ...prev, [campo]: v }))
    // Al corregir un campo, su error desaparece de inmediato.
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = registroInformeSchema.safeParse(valores)
    if (!parsed.success) {
      const nuevos: Partial<Record<keyof RegistroInformeInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0] as keyof RegistroInformeInput
        if (campo && !nuevos[campo]) nuevos[campo] = issue.message
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

  if (enviado) return <Confirmacion />

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="rounded-lg border border-border bg-white">
        <div className="space-y-6 p-5 sm:p-7">
          <Campo
            id="colaborador"
            etiqueta="Nombre completo del colaborador"
            valor={valores.colaborador}
            onChange={(v) => set("colaborador", v)}
            error={errores.colaborador}
            autoComplete="name"
          />

          <Campo
            id="area"
            etiqueta="Área, departamento o centro de trabajo"
            valor={valores.area}
            onChange={(v) => set("area", v)}
            error={errores.area}
            autoComplete="organization"
          />

          <Campo
            id="invitado"
            etiqueta="Nombre completo del familiar invitado"
            ayuda="El invitado debe ser un familiar del colaborador."
            valor={valores.invitado}
            onChange={(v) => set("invitado", v)}
            error={errores.invitado}
          />

          {/* Parentesco */}
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-foreground">
              Parentesco del invitado con el colaborador
            </legend>
            <div
              className={cn(
                "mt-3 space-y-2",
                errores.parentesco && "rounded-lg ring-1 ring-red-300"
              )}
            >
              {PARENTESCOS_INFORME.map((p) => {
                const activo = valores.parentesco === p.valor
                return (
                  <button
                    key={p.valor}
                    type="button"
                    onClick={() => set("parentesco", p.valor)}
                    aria-pressed={activo}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left text-[15px] transition-colors",
                      activo
                        ? "border-gobierno bg-gobierno/[0.04] font-medium text-gobierno"
                        : "border-input text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
                        activo ? "border-gobierno" : "border-muted-foreground/35"
                      )}
                    >
                      {activo && (
                        <span className="size-2 rounded-full bg-gobierno" />
                      )}
                    </span>
                    {p.label}
                  </button>
                )
              })}
            </div>
            {errores.parentesco && (
              <p className="mt-2 text-xs text-red-600">{errores.parentesco}</p>
            )}
          </fieldset>
        </div>

        {/* Envío */}
        <div className="border-t border-border p-5 sm:px-7">
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

// --- Campo de texto ----------------------------------------------------------

function Campo({
  id,
  etiqueta,
  ayuda,
  valor,
  onChange,
  error,
  autoComplete,
}: {
  id: string
  etiqueta: string
  ayuda?: string
  valor: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground"
      >
        {etiqueta}
      </label>
      {ayuda && (
        <p className="mt-0.5 text-xs text-muted-foreground">{ayuda}</p>
      )}
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

function Confirmacion() {
  return (
    <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gobierno/[0.06]">
        <Check className="size-7 text-gobierno" strokeWidth={2.5} />
      </div>
      <p className="text-lg font-semibold text-foreground">
        Registro completado
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {EVENTO_INFORME.confirmacion}
      </p>
      <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
        {EVENTO_INFORME.institucion}
      </p>
    </div>
  )
}
