"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Coordinadora, Zona } from "@prisma/client"

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
import {
  coordinadoraSchema,
  ROL_COORDINADORA_LABEL,
  type CoordinadoraInput,
} from "@/lib/schemas/coordinadora"
import { crearCoordinadora, editarCoordinadora } from "@/app/(app)/catalogos/coordinadoras/actions"

export function CoordinadoraFormDialog({
  open,
  onOpenChange,
  zonas,
  coordinadora,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  zonas: Pick<Zona, "id" | "nombre">[]
  coordinadora?: Coordinadora
}) {
  const router = useRouter()
  const esEdicion = Boolean(coordinadora)

  const form = useForm<CoordinadoraInput>({
    resolver: zodResolver(coordinadoraSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      rol: "centro",
      zonaId: null,
    },
  })

  // Al abrir, cargar los valores de la coordinadora (edición) o limpiar (alta).
  useEffect(() => {
    if (!open) return
    form.reset({
      nombre: coordinadora?.nombre ?? "",
      apellidoPaterno: coordinadora?.apellidoPaterno ?? "",
      apellidoMaterno: coordinadora?.apellidoMaterno ?? "",
      telefono: coordinadora?.telefono ?? "",
      rol: coordinadora?.rol ?? "centro",
      zonaId: coordinadora?.zonaId ?? null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coordinadora])

  const rolActual = form.watch("rol")

  async function onSubmit(valores: CoordinadoraInput) {
    const resultado = esEdicion
      ? await editarCoordinadora(coordinadora!.id, valores)
      : await crearCoordinadora(valores)

    if (resultado.ok) {
      toast.success(resultado.mensaje ?? "Listo")
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(resultado.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar coordinadora" : "Nueva coordinadora"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Actualiza los datos de la coordinadora."
              : "Registra una nueva coordinadora en el catálogo."}
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
                    <Input placeholder="Ej. María Guadalupe" {...field} />
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
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        if (v !== "zona") form.setValue("zonaId", null)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROL_COORDINADORA_LABEL).map(([valor, label]) => (
                          <SelectItem key={valor} value={valor}>
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

            {rolActual === "zona" && (
              <FormField
                control={form.control}
                name="zonaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona asignada</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {esEdicion ? "Guardar cambios" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
