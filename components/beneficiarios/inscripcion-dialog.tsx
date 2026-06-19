"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { inscripcionSchema, type InscripcionInput } from "@/lib/schemas/inscripcion"
import { hoyISO } from "@/lib/fechas"
import { crearInscripcion } from "@/app/(app)/beneficiarios/actions"
import type { CentroConClases } from "@/lib/data/beneficiarios"

const DIA_ABBR: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
}

function resumenHorario(cc: CentroConClases["clasesCentro"][number]) {
  if (cc.horarios.length === 0) return "Sin horario"
  return cc.horarios
    .map((h) => `${DIA_ABBR[h.diaSemana] ?? h.diaSemana} ${h.horaInicio}–${h.horaFin}`)
    .join(", ")
}

export function InscripcionDialog({
  beneficiarioId,
  centros,
  open,
  onOpenChange,
}: {
  beneficiarioId: number
  centros: CentroConClases[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [centroId, setCentroId] = useState<number | null>(null)

  const form = useForm<InscripcionInput>({
    resolver: zodResolver(inscripcionSchema),
    defaultValues: {
      claseCentroId: undefined as unknown as number,
      fechaInscripcion: hoyISO(),
      observaciones: "",
    },
  })

  useEffect(() => {
    if (open) {
      setCentroId(null)
      form.reset({
        claseCentroId: undefined as unknown as number,
        fechaInscripcion: hoyISO(),
        observaciones: "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const centroSeleccionado = centros.find((c) => c.id === centroId)

  async function onSubmit(valores: InscripcionInput) {
    const r = await crearInscripcion(beneficiarioId, valores)
    if (r.ok) {
      toast.success(r.mensaje ?? "Inscripción registrada")
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(r.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva inscripción</DialogTitle>
          <DialogDescription>
            Selecciona el centro y la clase a la que se inscribe.
          </DialogDescription>
        </DialogHeader>

        {centros.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            No hay centros con clases activas disponibles para inscribir.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Centro (no es campo del esquema; filtra las clases) */}
              <div className="space-y-2">
                <Label>Centro</Label>
                <Select
                  value={centroId ? String(centroId) : ""}
                  onValueChange={(v) => {
                    setCentroId(Number(v))
                    form.resetField("claseCentroId")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centros.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="claseCentroId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clase</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={!centroSeleccionado}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              centroSeleccionado
                                ? "Selecciona una clase"
                                : "Primero elige un centro"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centroSeleccionado?.clasesCentro.map((cc) => (
                          <SelectItem key={cc.id} value={String(cc.id)}>
                            {cc.clase.nombreOficial} · {resumenHorario(cc)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaInscripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inscripción</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-agua hover:bg-agua-600"
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Inscribir
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
