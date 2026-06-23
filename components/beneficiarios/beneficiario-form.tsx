"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Cake } from "lucide-react"
import { toast } from "sonner"
import type { Beneficiario } from "@prisma/client"

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
  beneficiarioSchema,
  ESCOLARIDADES,
  ESCOLARIDAD_LABEL,
  aplicaGradoEscuela,
  type BeneficiarioInput,
} from "@/lib/schemas/beneficiario"
import { calcularEdad } from "@/lib/fechas"
import {
  crearBeneficiario,
  editarBeneficiario,
} from "@/app/(app)/beneficiarios/actions"

export function BeneficiarioForm({
  beneficiario,
  valoresIniciales,
}: {
  beneficiario?: Beneficiario
  valoresIniciales?: Partial<BeneficiarioInput>
}) {
  const router = useRouter()
  const esEdicion = Boolean(beneficiario)

  const form = useForm<BeneficiarioInput>({
    resolver: zodResolver(beneficiarioSchema),
    defaultValues: {
      apellidoPaterno:
        beneficiario?.apellidoPaterno ?? valoresIniciales?.apellidoPaterno ?? "",
      apellidoMaterno:
        beneficiario?.apellidoMaterno ?? valoresIniciales?.apellidoMaterno ?? "",
      nombres: beneficiario?.nombres ?? valoresIniciales?.nombres ?? "",
      fechaNacimiento: beneficiario
        ? beneficiario.fechaNacimiento.toISOString().slice(0, 10)
        : valoresIniciales?.fechaNacimiento ?? "",
      curp: beneficiario?.curp ?? valoresIniciales?.curp ?? "",
      sinCurp: beneficiario?.sinCurp ?? false,
      telefono: beneficiario?.telefono ?? "",
      domicilio: beneficiario?.domicilio ?? "",
      escolaridad: beneficiario?.escolaridad ?? undefined,
      gradoEscolar: beneficiario?.gradoEscolar ?? "",
      nombreEscuela: beneficiario?.nombreEscuela ?? "",
      observaciones: beneficiario?.observaciones ?? "",
    },
  })

  const fechaNac = form.watch("fechaNacimiento")
  const escolaridad = form.watch("escolaridad")
  const mostrarEscuela = aplicaGradoEscuela(escolaridad)

  let edad: number | null = null
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNac ?? "")) {
    const e = calcularEdad(new Date(fechaNac))
    if (e >= 0 && e < 130) edad = e
  }

  async function onSubmit(valores: BeneficiarioInput) {
    if (esEdicion) {
      const r = await editarBeneficiario(beneficiario!.id, valores)
      if (r.ok) {
        toast.success(r.mensaje ?? "Guardado")
        router.push(`/beneficiarios/${beneficiario!.id}`)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    } else {
      const r = await crearBeneficiario(valores)
      if (r.ok) {
        toast.success("Beneficiario registrado")
        // Lleva a la ficha y ofrece inscribir de inmediato.
        router.push(`/beneficiarios/${r.id}?inscribir=1`)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos personales */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-foreground">Datos personales</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="apellidoPaterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido paterno</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellidoMaterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido materno</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre(s)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fechaNacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" max="2100-12-31" {...field} />
                    </FormControl>
                    {edad !== null && (
                      <FormDescription className="flex items-center gap-1.5 text-foreground">
                        <Cake className="size-3.5 text-agua" />
                        {edad} años
                        {edad < 18 && (
                          <span className="text-muted-foreground">· menor de edad</span>
                        )}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="curp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CURP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="18 caracteres (opcional)"
                        maxLength={18}
                        className="uppercase"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domicilio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domicilio</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Escolaridad */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-foreground">Escolaridad</h2>

            <FormField
              control={form.control}
              name="escolaridad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de escolaridad</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESCOLARIDADES.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESCOLARIDAD_LABEL[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mostrarEscuela && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gradoEscolar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grado escolar</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. 3°"
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
                  name="nombreEscuela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la escuela</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardContent className="p-5">
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Notas adicionales (opcional)"
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
            {esEdicion ? "Guardar cambios" : "Registrar beneficiario"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
