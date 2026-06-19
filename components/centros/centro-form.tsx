"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import type { Centro } from "@prisma/client"

import {
  Form,
  FormControl,
  FormDescription,
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
  centroSchema,
  type CentroInput,
  TIPO_CENTRO_LABEL,
  ESTATUS_CENTRO_LABEL,
} from "@/lib/schemas/centro"
import type { ZonaConCoordinadora } from "@/lib/data/centros"
import { crearCentro, editarCentro } from "@/app/(app)/centros/actions"

type CoordinadoraOpcion = {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string | null
}

export function CentroForm({
  zonas,
  coordinadoras,
  centro,
  zonaBloqueada,
}: {
  zonas: ZonaConCoordinadora[]
  coordinadoras: CoordinadoraOpcion[]
  centro?: Centro
  zonaBloqueada?: number | null
}) {
  const router = useRouter()
  const esEdicion = Boolean(centro)

  const form = useForm<CentroInput>({
    resolver: zodResolver(centroSchema),
    defaultValues: {
      nombre: centro?.nombre ?? "",
      tipo: centro?.tipo ?? "centro_comunitario",
      zonaId: centro?.zonaId ?? zonaBloqueada ?? (undefined as unknown as number),
      coordinadoraId: centro?.coordinadoraId ?? null,
      estatus: centro?.estatus ?? "activo",
      direccion: centro?.direccion ?? "",
      referenciaUbicacion: centro?.referenciaUbicacion ?? "",
      horarioGeneral: centro?.horarioGeneral ?? "",
      observaciones: centro?.observaciones ?? "",
    },
  })

  const zonaSeleccionada = form.watch("zonaId")
  const coordinadoraDeZona =
    zonas.find((z) => z.id === zonaSeleccionada)?.coordinadoraZona ?? null

  async function onSubmit(valores: CentroInput) {
    if (esEdicion) {
      const r = await editarCentro(centro!.id, valores)
      if (r.ok) {
        toast.success(r.mensaje ?? "Guardado")
        router.push(`/centros/${centro!.id}`)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    } else {
      const r = await crearCentro(valores)
      if (r.ok) {
        toast.success("Centro registrado")
        router.push(`/centros/${r.id}`)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos esenciales */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Información general
            </h2>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del centro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Centro Comunitario Riberas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_CENTRO_LABEL).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
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
                name="estatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estatus</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ESTATUS_CENTRO_LABEL).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Zona y coordinación */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Zona y coordinación
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="zonaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={zonaBloqueada != null}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la zona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zonas.map((z) => (
                          <SelectItem key={z.id} value={String(z.id)}>
                            {z.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {zonaBloqueada != null && (
                      <FormDescription>
                        Tu usuario está limitado a tu zona.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Coordinadora de zona: solo lectura, se infiere de la zona.
                  No usa FormField porque no es un campo del formulario. */}
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">
                  Coordinadora de zona
                </p>
                <div className="flex h-10 items-center rounded-md border border-dashed bg-muted/40 px-3 text-sm text-muted-foreground">
                  {zonaSeleccionada
                    ? coordinadoraDeZona ?? "Sin coordinadora asignada"
                    : "Selecciona una zona"}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Se asigna automáticamente según la zona.
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="coordinadoraId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinadora del centro</FormLabel>
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
                      {coordinadoras.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre} {c.apellidoPaterno} {c.apellidoMaterno ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {coordinadoras.length === 0 && (
                    <FormDescription>
                      No hay coordinadoras de centro activas. Regístralas en
                      Catálogos.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Ubicación y detalles (opcionales) */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="size-4 text-muted-foreground" />
              Ubicación y detalles{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </h2>

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Calle, número, colonia"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenciaUbicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia de ubicación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Frente a la primaria Benito Juárez"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horarioGeneral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horario general del espacio</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Lunes a viernes de 8:00 a 18:00"
                      {...field}
                      value={field.value ?? ""}
                    />
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
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Notas adicionales del centro"
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
            {esEdicion ? "Guardar cambios" : "Registrar centro"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
