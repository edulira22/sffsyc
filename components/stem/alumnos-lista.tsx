"use client"

import { useState } from "react"
import Link from "@/components/ui/enlace"
import { Search, Users } from "lucide-react"

import { GRADOS_ESCOLARES, label } from "@/lib/stem/catalogos"
import type { AlumnoListado } from "@/lib/data/stem"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui-patterns/empty-state"

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function AlumnosLista({ alumnos }: { alumnos: AlumnoListado[] }) {
  const [q, setQ] = useState("")
  const palabras = norm(q).trim().split(/\s+/).filter(Boolean)
  const lista = alumnos.filter((a) => palabras.every((p) => norm(`${a.nombre} ${a.curp} ${a.folio} ${a.tutorNombre}`).includes(p)))

  if (alumnos.length === 0) {
    return <EmptyState icono={Users} titulo="Aún no hay alumnos" descripcion="Registra a los alumnos con su CURP; cada uno recibe un folio único." />
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, CURP, folio o tutor…" className="pl-9" />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-superficie text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Alumno</th>
              <th className="px-4 py-2 font-medium">Edad</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Grado</th>
              <th className="hidden px-4 py-2 font-medium lg:table-cell">Tutor</th>
              <th className="px-4 py-2 font-medium">Curso actual</th>
              <th className="px-4 py-2 text-right font-medium">Cursos</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lista.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <Link href={`/stem/alumnos/${a.id}`} className="font-medium text-foreground hover:text-agua">
                    {a.nombre}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {a.folio} · <span className="font-mono">{a.curp}</span>
                  </p>
                </td>
                <td className="px-4 py-2.5 tabular-nums">{a.edad}</td>
                <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{label(GRADOS_ESCOLARES, a.gradoEscolar)}</td>
                <td className="hidden px-4 py-2.5 lg:table-cell">
                  <p>{a.tutorNombre}</p>
                  <p className="text-xs text-muted-foreground">{a.tutorTelefono}</p>
                </td>
                <td className="px-4 py-2.5">{a.cursoActual ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {a.totalCursos}
                  {a.totalCursos > 1 && <span className="ml-1 text-xs text-agua">reinscrito</span>}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nadie coincide con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {lista.length} de {alumnos.length} alumnos
      </p>
    </div>
  )
}
