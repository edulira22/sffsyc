"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, CheckCircle2, AlertTriangle, XCircle, FileUp } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ENTIDADES_EXCEL, ORDEN_ENTIDADES } from "@/lib/excel/columnas"
import {
  analizarImportacion,
  confirmarImportacion,
} from "@/app/(app)/datos/actions"
import type { ResultadoAnalisis } from "@/lib/excel/importar"

const ESTILO_ESTADO: Record<string, string> = {
  nueva: "bg-agua-50 text-agua-700 ring-agua/20",
  duplicada: "bg-amber-50 text-amber-700 ring-amber-200",
  error: "bg-red-50 text-red-700 ring-red-200",
}
const TEXTO_ESTADO: Record<string, string> = {
  nueva: "Nueva",
  duplicada: "Duplicada",
  error: "Error",
}

export function Importador() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [entidad, setEntidad] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [analisis, setAnalisis] = useState<ResultadoAnalisis | null>(null)

  function reiniciar() {
    setAnalisis(null)
    setArchivo(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function analizar() {
    if (!entidad || !archivo) return
    setAnalizando(true)
    setAnalisis(null)
    try {
      const fd = new FormData()
      fd.append("archivo", archivo)
      const r = await analizarImportacion(entidad, fd)
      if (!r.ok) {
        toast.error("No se pudo analizar", { description: r.error })
        return
      }
      setAnalisis(r)
    } finally {
      setAnalizando(false)
    }
  }

  async function confirmar() {
    if (!analisis) return
    const nuevas = analisis.filas.filter((f) => f.estado === "nueva").map((f) => f.valores)
    if (nuevas.length === 0) return
    setConfirmando(true)
    try {
      const r = await confirmarImportacion(analisis.entidad, nuevas)
      if (r.ok) {
        toast.success(`${r.insertadas} registros importados`, {
          description:
            r.errores > 0 ? `${r.errores} no se pudieron insertar.` : undefined,
        })
        reiniciar()
        router.refresh()
      } else {
        toast.error(r.error ?? "Error al importar")
      }
    } finally {
      setConfirmando(false)
    }
  }

  const nuevas = analisis?.resumen.nuevas ?? 0

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>¿Qué vas a importar?</Label>
            <Select
              value={entidad}
              onValueChange={(v) => {
                setEntidad(v)
                reiniciar()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una entidad" />
              </SelectTrigger>
              <SelectContent>
                {ORDEN_ENTIDADES.map((id) => (
                  <SelectItem key={id} value={id}>
                    {ENTIDADES_EXCEL[id].titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archivo">Archivo Excel (.xlsx)</Label>
            <input
              id="archivo"
              ref={inputRef}
              type="file"
              accept=".xlsx"
              disabled={!entidad}
              onChange={(e) => {
                setArchivo(e.target.files?.[0] ?? null)
                setAnalisis(null)
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-muted/70 disabled:opacity-50"
            />
          </div>
        </div>

        <Button
          onClick={analizar}
          disabled={!entidad || !archivo || analizando}
          variant="outline"
        >
          {analizando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
          Analizar archivo
        </Button>

        {analisis && (
          <div className="space-y-4 pt-2">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3">
              <Resumen icono={CheckCircle2} clase="text-agua" n={analisis.resumen.nuevas} etiqueta="Nuevas" />
              <Resumen icono={AlertTriangle} clase="text-amber-600" n={analisis.resumen.duplicadas} etiqueta="Duplicadas" />
              <Resumen icono={XCircle} clase="text-red-600" n={analisis.resumen.errores} etiqueta="Con error" />
            </div>

            <div className="max-h-96 overflow-auto rounded-xl border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-14">Fila</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="w-28">Estado</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analisis.filas.map((f) => (
                    <TableRow key={f.numero}>
                      <TableCell className="text-muted-foreground">{f.numero}</TableCell>
                      <TableCell className="font-medium">{f.resumen || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                            ESTILO_ESTADO[f.estado]
                          )}
                        >
                          {TEXTO_ESTADO[f.estado]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f.problemas.join(" · ") || "Lista para importar"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {nuevas > 0
                  ? `Se importarán ${nuevas} ${nuevas === 1 ? "registro nuevo" : "registros nuevos"}. Las duplicadas y con error se omiten.`
                  : "No hay registros nuevos para importar."}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={reiniciar} disabled={confirmando}>
                  Cancelar
                </Button>
                <Button
                  onClick={confirmar}
                  disabled={nuevas === 0 || confirmando}
                  className="bg-agua hover:bg-agua-600"
                >
                  {confirmando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Importar {nuevas > 0 ? `(${nuevas})` : ""}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Resumen({
  icono: Icono,
  clase,
  n,
  etiqueta,
}: {
  icono: typeof CheckCircle2
  clase: string
  n: number
  etiqueta: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-3">
      <Icono className={cn("size-5", clase)} />
      <div>
        <p className="text-xl font-bold text-foreground">{n}</p>
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
      </div>
    </div>
  )
}
