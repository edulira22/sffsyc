"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Loader2, UserPlus, AlertTriangle, ArrowLeft } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { BeneficiarioForm } from "@/components/beneficiarios/beneficiario-form"
import { accionBuscarDuplicados } from "@/app/(app)/beneficiarios/actions"

type Coincidencia = Awaited<ReturnType<typeof accionBuscarDuplicados>>[number]

export function BuscarYRegistrar() {
  const [paso, setPaso] = useState<"buscar" | "registrar">("buscar")
  const [cargando, setCargando] = useState(false)
  const [busco, setBusco] = useState(false)
  const [resultados, setResultados] = useState<Coincidencia[]>([])

  const [datos, setDatos] = useState({
    curp: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombres: "",
    fechaNacimiento: "",
  })

  const puedeBuscar =
    datos.curp.trim().length > 0 ||
    (datos.nombres.trim().length > 0 && datos.apellidoPaterno.trim().length > 0)

  async function buscar() {
    setCargando(true)
    try {
      const r = await accionBuscarDuplicados(datos)
      setResultados(r)
      setBusco(true)
    } finally {
      setCargando(false)
    }
  }

  if (paso === "registrar") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setPaso("buscar")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la búsqueda
        </button>
        <BeneficiarioForm valoresIniciales={datos} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Primero, evitemos duplicados
            </h2>
            <p className="text-sm text-muted-foreground">
              Busca por CURP o por nombre y apellidos antes de registrar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="curp">CURP</Label>
            <Input
              id="curp"
              placeholder="18 caracteres"
              maxLength={18}
              className="uppercase"
              value={datos.curp}
              onChange={(e) => setDatos({ ...datos, curp: e.target.value })}
            />
          </div>

          <div className="text-center text-xs uppercase tracking-wide text-muted-foreground">
            o
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ap">Apellido paterno</Label>
              <Input
                id="ap"
                value={datos.apellidoPaterno}
                onChange={(e) =>
                  setDatos({ ...datos, apellidoPaterno: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="am">Apellido materno</Label>
              <Input
                id="am"
                value={datos.apellidoMaterno}
                onChange={(e) =>
                  setDatos({ ...datos, apellidoMaterno: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nombre(s)</Label>
              <Input
                id="nom"
                value={datos.nombres}
                onChange={(e) => setDatos({ ...datos, nombres: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fn">Fecha de nacimiento</Label>
            <Input
              id="fn"
              type="date"
              value={datos.fechaNacimiento}
              onChange={(e) =>
                setDatos({ ...datos, fechaNacimiento: e.target.value })
              }
            />
          </div>

          <Button
            onClick={buscar}
            disabled={!puedeBuscar || cargando}
            className="w-full bg-agua hover:bg-agua-600"
          >
            {cargando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar coincidencias
          </Button>
        </CardContent>
      </Card>

      {busco && resultados.length > 0 && (
        <Card className="border-amber-300">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="size-4" />
              <h3 className="text-sm font-semibold">
                Encontramos {resultados.length}{" "}
                {resultados.length === 1
                  ? "posible coincidencia"
                  : "posibles coincidencias"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Revisa si la persona ya está registrada antes de crear un duplicado.
            </p>
            <div className="divide-y rounded-lg border">
              {resultados.map((c) => (
                <Link
                  key={c.id}
                  href={`/beneficiarios/${c.id}`}
                  className="flex items-center justify-between gap-2 p-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.curp ? `CURP ${c.curp}` : "Sin CURP"} · Nac.{" "}
                      {c.fechaNacimiento}
                    </p>
                  </div>
                  <StatusBadge estatus={c.estatus} />
                </Link>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPaso("registrar")}
            >
              <UserPlus className="size-4" />
              Ninguno es, registrar nuevo
            </Button>
          </CardContent>
        </Card>
      )}

      {busco && resultados.length === 0 && (
        <Card className="border-agua/40">
          <CardContent className="space-y-3 p-5 text-center">
            <p className="text-sm text-foreground">
              No encontramos coincidencias. Puedes registrar al nuevo beneficiario.
            </p>
            <Button
              onClick={() => setPaso("registrar")}
              className="bg-agua hover:bg-agua-600"
            >
              <UserPlus className="size-4" />
              Registrar nuevo beneficiario
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
