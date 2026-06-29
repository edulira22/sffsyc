"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  FileText,
  UserMinus,
  RotateCcw,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui-patterns/confirm-dialog"
import {
  folioVerano,
  grupoPorId,
  GRUPOS_VERANO,
  TOTAL_REQUISITOS,
} from "@/lib/eventos/verano"
import { calcularEdad, formatoFecha } from "@/lib/fechas"
import type { InscripcionVeranoListado } from "@/lib/data/verano"
import {
  darDeBajaVerano,
  reactivarVerano,
  eliminarInscripcionVerano,
} from "@/app/(app)/eventos/verano-difertido/inscripciones/actions"

type SortKey = "folio" | "nombre" | "edad" | "docs" | "fecha"

function requisitos(i: InscripcionVeranoListado): number {
  const docs = ((i.documentos as unknown as string[]) ?? []).length
  return docs + (i.reciboPago?.trim() ? 1 : 0)
}

export function InscripcionesTabla({
  inscripciones,
}: {
  inscripciones: InscripcionVeranoListado[]
}) {
  const router = useRouter()

  const [busqueda, setBusqueda] = useState("")
  const [equipo, setEquipo] = useState("todos")
  const [docsFiltro, setDocsFiltro] = useState("todos")
  const [estatus, setEstatus] = useState("activos")
  const [sortKey, setSortKey] = useState<SortKey>("fecha")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Diálogos
  const [bajaTarget, setBajaTarget] = useState<InscripcionVeranoListado | null>(null)
  const [motivo, setMotivo] = useState("")
  const [guardandoBaja, setGuardandoBaja] = useState(false)
  const [eliminarTarget, setEliminarTarget] = useState<InscripcionVeranoListado | null>(null)

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = inscripciones.filter((i) => {
      if (estatus === "activos" && i.estatus !== "activa") return false
      if (estatus === "bajas" && i.estatus !== "baja") return false
      if (equipo !== "todos" && i.grupo !== equipo) return false
      const completo = requisitos(i) === TOTAL_REQUISITOS
      if (docsFiltro === "completos" && !completo) return false
      if (docsFiltro === "incompletos" && completo) return false
      if (q) {
        const enNombre = i.nombre.toLowerCase().includes(q)
        const enFolio = folioVerano(i.id).toLowerCase().includes(q)
        if (!enNombre && !enFolio) return false
      }
      return true
    })

    const dir = sortDir === "asc" ? 1 : -1
    return [...lista].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "folio":
          cmp = a.id - b.id
          break
        case "nombre":
          cmp = a.nombre.localeCompare(b.nombre, "es")
          break
        case "edad":
          cmp = calcularEdad(a.fechaNacimiento) - calcularEdad(b.fechaNacimiento)
          break
        case "docs":
          cmp = requisitos(a) - requisitos(b)
          break
        case "fecha":
          cmp = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }
      return cmp * dir
    })
  }, [inscripciones, busqueda, equipo, docsFiltro, estatus, sortKey, sortDir])

  function ordenarPor(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "nombre" ? "asc" : "desc")
    }
  }

  function IconoOrden({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="size-3.5 opacity-40" />
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    )
  }

  function Encabezado({ k, children }: { k: SortKey; children: React.ReactNode }) {
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => ordenarPor(k)}
          className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        >
          {children}
          <IconoOrden k={k} />
        </button>
      </TableHead>
    )
  }

  async function confirmarBaja() {
    if (!bajaTarget) return
    setGuardandoBaja(true)
    try {
      const r = await darDeBajaVerano(bajaTarget.id, motivo)
      if (r.ok) {
        toast.success(r.mensaje ?? "Dada de baja")
        setBajaTarget(null)
        setMotivo("")
        router.refresh()
      } else {
        toast.error(r.error)
      }
    } finally {
      setGuardandoBaja(false)
    }
  }

  async function reactivar(i: InscripcionVeranoListado) {
    const r = await reactivarVerano(i.id)
    if (r.ok) {
      toast.success(r.mensaje ?? "Reactivada")
      router.refresh()
    } else toast.error(r.error)
  }

  const activos = inscripciones.filter((i) => i.estatus === "activa").length
  const completos = inscripciones.filter(
    (i) => i.estatus === "activa" && requisitos(i) === TOTAL_REQUISITOS
  ).length

  return (
    <div className="space-y-3">
      {/* Resumen rápido */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gobierno-50 px-2.5 py-1 font-medium text-gobierno">
          {activos} activos
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
          {completos} con todo completo
        </span>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o folio…"
            className="h-9 pl-8"
          />
        </div>

        <Select value={equipo} onValueChange={setEquipo}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Equipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los equipos</SelectItem>
            {GRUPOS_VERANO.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={docsFiltro} onValueChange={setDocsFiltro}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Documentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="completos">Completos</SelectItem>
            <SelectItem value="incompletos">Incompletos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={estatus} onValueChange={setEstatus}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="bajas">Bajas</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <Encabezado k="folio">Folio</Encabezado>
              <Encabezado k="nombre">Nombre</Encabezado>
              <Encabezado k="edad">Edad</Encabezado>
              <TableHead>Equipo</TableHead>
              <TableHead>Talla</TableHead>
              <Encabezado k="docs">Documentos</Encabezado>
              <Encabezado k="fecha">Inscrito</Encabezado>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No hay inscripciones que coincidan con el filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((i) => {
                const grupo = i.grupo ? grupoPorId(i.grupo) : undefined
                const req = requisitos(i)
                const completo = req === TOTAL_REQUISITOS
                const baja = i.estatus === "baja"
                return (
                  <TableRow
                    key={i.id}
                    className={cn(
                      baja && "bg-muted/40 text-muted-foreground [&_*]:line-through",
                      !baja && completo && "bg-emerald-50/60"
                    )}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {folioVerano(i.id)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1.5">
                        {!baja && completo && (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 no-underline" />
                        )}
                        {i.nombre}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {calcularEdad(i.fechaNacimiento)} años
                    </TableCell>
                    <TableCell>
                      {grupo ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className="inline-block size-2.5 rounded-full no-underline"
                            style={{ backgroundColor: grupo.hex }}
                          />
                          {grupo.nombre}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{i.talla || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold no-underline",
                          baja
                            ? "bg-muted text-muted-foreground"
                            : completo
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {req}/{TOTAL_REQUISITOS}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatoFecha(i.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Acciones" className="no-underline">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/eventos/verano-difertido/inscripciones/${i.id}`}>
                              <FileText className="size-4" />
                              Ver expediente
                            </Link>
                          </DropdownMenuItem>
                          {baja ? (
                            <DropdownMenuItem onClick={() => reactivar(i)}>
                              <RotateCcw className="size-4" />
                              Reactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setMotivo("")
                                setBajaTarget(i)
                              }}
                            >
                              <UserMinus className="size-4" />
                              Dar de baja
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setEliminarTarget(i)}
                          >
                            <Trash2 className="size-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo: dar de baja con motivo */}
      <Dialog
        open={bajaTarget !== null}
        onOpenChange={(o) => !o && !guardandoBaja && setBajaTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dar de baja</DialogTitle>
            <DialogDescription>
              {bajaTarget?.nombre} quedará marcado como baja (gris y tachado). No se
              borra; puedes reactivarlo después.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Motivo de la baja
            </label>
            <Textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. La familia canceló, dato capturado por error, etc."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBajaTarget(null)} disabled={guardandoBaja}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarBaja}
              disabled={guardandoBaja || !motivo.trim()}
              className="bg-gobierno hover:bg-gobierno/90"
            >
              {guardandoBaja && <Loader2 className="size-4 animate-spin" />}
              Dar de baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: eliminar definitivo */}
      <ConfirmDialog
        open={eliminarTarget !== null}
        onOpenChange={(o) => !o && setEliminarTarget(null)}
        titulo="¿Eliminar definitivamente?"
        descripcion={
          eliminarTarget
            ? `Se borrará el registro de ${eliminarTarget.nombre} de la base de datos. Esta acción no se puede deshacer. Si solo quieres que ya no participe, usa "Dar de baja".`
            : undefined
        }
        textoConfirmar="Eliminar"
        destructivo
        onConfirm={async () => {
          if (!eliminarTarget) return
          const r = await eliminarInscripcionVerano(eliminarTarget.id)
          if (r.ok) {
            toast.success(r.mensaje ?? "Eliminada")
            router.refresh()
          } else toast.error(r.error)
        }}
      />
    </div>
  )
}
