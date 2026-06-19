"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  email: z
    .string()
    .min(1, "Escribe tu correo")
    .email("El correo no tiene un formato válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
})

type Valores = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [verPassword, setVerPassword] = useState(false)

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(valores: Valores) {
    setCargando(true)
    try {
      const resultado = await signIn("credentials", {
        email: valores.email,
        password: valores.password,
        redirect: false,
      })

      if (resultado?.error) {
        toast.error("No pudimos iniciar sesión", {
          description:
            "El correo o la contraseña no son correctos, o la cuenta está inactiva.",
        })
        form.setError("password", { message: "Credenciales incorrectas" })
        return
      }

      toast.success("Bienvenido", { description: "Sesión iniciada correctamente." })
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Ocurrió un error", {
        description: "Inténtalo de nuevo en unos momentos.",
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo institucional</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@dif.chihuahua.gob.mx"
                  disabled={cargando}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={verPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={cargando}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {verPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={cargando}
          className="w-full bg-agua hover:bg-agua-600 text-white"
          size="lg"
        >
          {cargando ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Iniciando sesión…
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Iniciar sesión
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
