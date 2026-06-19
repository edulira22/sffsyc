"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Profesor } from "@prisma/client"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { profesorSchema, type ProfesorInput } from "@/lib/schemas/profesor"
import { crearProfesor, editarProfesor } from "@/app/(app)/catalogos/profesores/actions"

export function ProfesorFormDialog({
  open,
  onOpenChange,
  profesor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profesor?: Profesor
}) {
  const router = useRouter()
  const esEdicion = Boolean(profesor)

  const form = useForm<ProfesorInput>({
    resolver: zodResolver(profesorSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      especialidad: "",
      observaciones: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      nombre: profesor?.nombre ?? "",
      apellidoPaterno: profesor?.apellidoPaterno ?? "",
      apellidoMaterno: profesor?.apellidoMaterno ?? "",
      telefono: profesor?.telefono ?? "",
      especialidad: profesor?.especialidad ?? "",
      observaciones: profesor?.observaciones ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profesor])

  async function onSubmit(valores: ProfesorInput) {
    const r = esEdicion
      ? await editarProfesor(profesor!.id, valores)
      : await crearProfesor(valores)
    if (r.ok) {
      toast.success(r.mensaje ?? "Listo")
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
          <DialogTitle>{esEdicion ? "Editar profesor" : "Nuevo profesor"}</DialogTitle>
          <DialogDescription>
            Datos del profesor que imparte clases en los centros.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="614 000 0000"
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
                name="especialidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Danza, Música"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-agua hover:bg-agua-600"
              >
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {esEdicion ? "Guardar cambios" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
