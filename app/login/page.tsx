import type { Metadata } from "next"
import { Building2 } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gobierno">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Encabezado institucional */}
          <div className="mb-8 text-center text-white">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Building2 className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SFFSyC</h1>
            <p className="mx-auto mt-1 max-w-xs text-sm text-white/70">
              Subdirección de Fortalecimiento Familiar, Social y Comunitario
            </p>
          </div>

          {/* Tarjeta de acceso */}
          <div className="rounded-2xl bg-white p-7 shadow-2xl shadow-black/20">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Acceso al sistema
              </h2>
              <p className="text-sm text-muted-foreground">
                Ingresa con tu correo y contraseña institucionales.
              </p>
            </div>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            DIF Municipal de Chihuahua · Uso interno
          </p>
        </div>
      </div>
    </div>
  )
}
