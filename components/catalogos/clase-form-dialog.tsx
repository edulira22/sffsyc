"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { CatalogoClase, CatalogoCategoria } from "@prisma/client"

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
import { claseSchema, type ClaseInput } from "@/lib/schemas/clase"
import { crearClase, editarClase } from "@/app/(app)/catalogos/clases/actions"

export function ClaseFormDialog({
  open,
  onOpenChange,
  categorias,
  clase,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: Pick<CatalogoCategoria, "id" | "nombre">[]
  clase?: CatalogoClase
}) {
  const router = useRouter()
  const esEdicion = Boolean(clase)

  const form = useForm<ClaseInput>({
    resolver: zodResolver(claseSchema),
    defaultValues: {
      nombreOficial: "",
      categoriaId: undefined as unknown as number,
      descripcion: "",
      variantesAlias: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      nombreOficial: clase?.nombreOficial ?? "",
      categoriaId: clase?.categoriaId ?? (undefined as unknown as number),
      descripcion: clase?.descripcion ?? "",
      variantesAlias: clase?.variantesAlias ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clase])

  async function onSubmit(valores: ClaseInput) {
    const r = esEdicion
      ? await editarClase(clase!.id, valores)
      : await crearClase(valores)
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
          <DialogTitle>{esEdicion ? "Editar clase" : "Nueva clase"}</DialogTitle>
          <DialogDescription>
            Nombre estandarizado de la clase y su categoría.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombreOficial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre oficial</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Zumba" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoriaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre}
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
              name="variantesAlias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variantes o alias</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Baile aeróbico, Zumba fitness"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Otros nombres con que se conoce esta clase (informativo).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Breve descripción de la clase (opcional)"
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
