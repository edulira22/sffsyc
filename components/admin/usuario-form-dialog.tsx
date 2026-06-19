"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Zona } from "@prisma/client"

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
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  ROLES_USUARIO,
  type CrearUsuarioInput,
} from "@/lib/schemas/usuario"
import { NOMBRE_ROL } from "@/lib/permisos"
import { crearUsuario, editarUsuario } from "@/app/(app)/admin/usuarios/actions"
import type { UsuarioListado } from "@/lib/data/usuarios"

export function UsuarioFormDialog({
  open,
  onOpenChange,
  zonas,
  usuario,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  zonas: Pick<Zona, "id" | "nombre">[]
  usuario?: UsuarioListado
}) {
  const router = useRouter()
  const esEdicion = Boolean(usuario)

  const form = useForm<CrearUsuarioInput>({
    // En edición la contraseña no aplica; el cast alinea ambos esquemas con el
    // tipo del formulario (el campo password simplemente se ignora al editar).
    resolver: zodResolver(
      esEdicion ? editarUsuarioSchema : crearUsuarioSchema
    ) as unknown as Resolver<CrearUsuarioInput>,
    defaultValues: {
      nombre: "",
      email: "",
      rol: "oficina",
      zonaId: null,
      password: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      nombre: usuario?.nombre ?? "",
      email: usuario?.email ?? "",
      rol: usuario?.rol ?? "oficina",
      zonaId: usuario?.zonaId ?? null,
      password: "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuario])

  const rol = form.watch("rol")

  async function onSubmit(valores: CrearUsuarioInput) {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Actualiza los datos y permisos del usuario."
              : "Crea una cuenta de acceso al sistema."}
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
                    <FormDescription>
                      El usuario podrá cambiarla después. Se guarda cifrada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        if (v !== "coordinadora_zona") form.setValue("zonaId", null)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES_USUARIO.map((r) => (
                          <SelectItem key={r} value={r}>
                            {NOMBRE_ROL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {rol === "coordinadora_zona" && (
                <FormField
                  control={form.control}
                  name="zonaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona</FormLabel>
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
            </div>

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
