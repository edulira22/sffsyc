"use client"

import { useEffect } from "react"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  type CrearUsuarioInput,
} from "@/lib/schemas/usuario"
import { crearUsuario, editarUsuario } from "@/app/(app)/admin/usuarios/actions"
import type { UsuarioListado } from "@/lib/data/usuarios"

type FormValues = CrearUsuarioInput

export function UsuarioFormDialog({
  open,
  onOpenChange,
  usuario,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: UsuarioListado
}) {
  const router = useRouter()
  const esEdicion = Boolean(usuario)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(esEdicion ? editarUsuarioSchema : crearUsuarioSchema) as any,
    defaultValues: { nombre: "", email: "", password: "" },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      nombre: usuario?.nombre ?? "",
      email: usuario?.email ?? "",
      password: "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuario])

  async function onSubmit(valores: FormValues) {
    const r = esEdicion
      ? await editarUsuario(usuario!.id, valores)
      : await crearUsuario(valores)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {esEdicion ? "Actualiza los datos del usuario." : "Crea una cuenta de acceso al sistema."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!esEdicion && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Mínimo 8 caracteres" {...field} />
                    </FormControl>
                    <FormDescription>Se guarda cifrada. El usuario podrá cambiarla.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {esEdicion ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
