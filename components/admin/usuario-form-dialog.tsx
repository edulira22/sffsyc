"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ShieldCheck } from "lucide-react"
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
import { NAV_AREAS } from "@/lib/navegacion"
import { crearUsuario, editarUsuario } from "@/app/(app)/admin/usuarios/actions"
import type { UsuarioListado } from "@/lib/data/usuarios"

// Todas las áreas de la plataforma son seleccionables por el admin.
const AREAS_OPCIONALES = NAV_AREAS

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
    resolver: zodResolver(
      esEdicion ? editarUsuarioSchema : crearUsuarioSchema
    ) as unknown as Resolver<CrearUsuarioInput>,
    defaultValues: {
      nombre: "",
      email: "",
      rol: "oficina",
      zonaId: null,
      password: "",
      areasPermitidas: [],
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
      areasPermitidas: usuario?.areasPermitidas ?? [],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuario])

  const rol = form.watch("rol")
  const esAdmin = rol === "admin"
  const areasActuales = form.watch("areasPermitidas")

  function toggleArea(areaId: string) {
    const actual = form.getValues("areasPermitidas")
    const nueva = actual.includes(areaId)
      ? actual.filter((a) => a !== areaId)
      : [...actual, areaId]
    form.setValue("areasPermitidas", nueva)
  }

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Rol y acceso</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol en Centros Comunitarios</FormLabel>
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
              </div>

              <div className="mt-4">
                <FormLabel>Acceso a áreas de la plataforma</FormLabel>
                {esAdmin ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border bg-gobierno-50 px-3 py-2.5 text-sm text-gobierno">
                    <ShieldCheck className="size-4 shrink-0" />
                    El Administrador tiene acceso completo a todas las áreas.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {AREAS_OPCIONALES.map((area) => {
                      const Icono = area.icono
                      const seleccionada = areasActuales.includes(area.id)
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => toggleArea(area.id)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            seleccionada
                              ? "border-gobierno/40 bg-gobierno-50"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={seleccionada}
                            readOnly
                            className="size-4 accent-gobierno pointer-events-none"
                          />
                          <Icono className="size-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{area.titulo}</p>
                            <p className="text-xs text-muted-foreground">{area.descripcion}</p>
                          </div>
                          {area.proximamente && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              Próximamente
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
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
