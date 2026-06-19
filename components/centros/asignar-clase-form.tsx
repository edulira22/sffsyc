"use client"

import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2, Clock } from "lucide-react"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  asignarClaseSchema,
  type AsignarClaseInput,
  DIAS_SEMANA,
  DIA_SEMANA_LABEL,
} from "@/lib/schemas/clase-centro"
import { asignarClase } from "@/app/(app)/centros/actions"

type ClaseOpcion = { id: number; nombreOficial: string; categoria: { nombre: string } }
type ProfesorOpcion = {
  id: number
  nombre: string
  apellidoPaterno: string
}

export function AsignarClaseForm({
  centroId,
  clases,
  profesores,
}: {
  centroId: number
  clases: ClaseOpcion[]
  profesores: ProfesorOpcion[]
}) {
  const router = useRouter()

  const form = useForm<AsignarClaseInput>({
    resolver: zodResolver(asignarClaseSchema),
    defaultValues: {
      claseId: undefined as unknown as number,
      profesorId: null,
      nivelGrupo: "",
      observaciones: "",
      horarios: [{ diaSemana: "lunes", horaInicio: "", horaFin: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "horarios",
  })

  async function onSubmit(valores: AsignarClaseInput) {
    const r = await asignarClase(centroId, valores)
    if (r.ok) {
      toast.success(r.mensaje ?? "Clase asignada")
      router.push(`/centros/${centroId}`)
      router.refresh()
    } else {
      toast.error(r.error)
    }
  }

  const erroresHorarios = form.formState.errors.horarios

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-5">
            <FormField
              control={form.control}
              name="claseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clase</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una clase del catálogo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clases.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombreOficial} · {c.categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="profesorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesor</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? null : Number(v))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {profesores.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nombre} {p.apellidoPaterno}
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
                name="nivelGrupo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel / grupo (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Principiantes"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloques de horario */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="size-4 text-muted-foreground" />
                Horarios
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ diaSemana: "lunes", horaInicio: "", horaFin: "" })
                }
              >
                <Plus className="size-4" />
                Agregar bloque
              </Button>
            </div>

            {typeof erroresHorarios?.message === "string" && (
              <p className="text-sm font-medium text-destructive">
                {erroresHorarios.message}
              </p>
            )}

            <div className="space-y-3">
              {fields.map((campo, index) => (
                <div
                  key={campo.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                >
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.diaSemana`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Día</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIAS_SEMANA.map((d) => (
                              <SelectItem key={d} value={d}>
                                {DIA_SEMANA_LABEL[d]}
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
                    name={`horarios.${index}.horaInicio`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Inicio</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.horaFin`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Quitar bloque"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Notas sobre esta clase en el centro"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-agua hover:bg-agua-600"
          >
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Asignar clase
          </Button>
        </div>
      </form>
    </Form>
  )
}
