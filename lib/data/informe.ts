import { prisma } from "@/lib/prisma"
import { PARENTESCOS_INFORME } from "@/lib/eventos/informe"

// Consultas de solo lectura del registro de asistencia al Informe.

export async function listarRegistrosInforme() {
  return prisma.registroInforme.findMany({
    where: { estatus: "activo" },
    orderBy: { createdAt: "desc" },
  })
}

export type RegistroInformeListado = Awaited<
  ReturnType<typeof listarRegistrosInforme>
>[number]

export type ConteoEtiquetado = {
  clave: string
  label: string
  cuenta: number
  pct: number
}

export type ResumenInforme = {
  /** Registros = colaboradores. Cada uno trae un invitado. */
  totalRegistros: number
  /** Personas esperadas: colaborador + invitado por registro. */
  totalPersonas: number
  totalAreas: number
  porParentesco: ConteoEtiquetado[]
  porArea: ConteoEtiquetado[]
  /** Nombres de colaborador que aparecen más de una vez. */
  posiblesDuplicados: { nombre: string; veces: number }[]
  ultimoRegistro: Date | null
}

function pct(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100)
}

/** Clave para comparar nombres ignorando acentos, mayúsculas y espacios. */
function normalizar(s: string): string {
  // \u0300-\u036f = marcas diacriticas combinantes que deja NFD.
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export async function obtenerResumenInforme(): Promise<ResumenInforme> {
  const filas = await listarRegistrosInforme()
  const total = filas.length

  // Parentescos, en el orden en que están definidos en el catálogo.
  const cuentaParentesco = new Map<string, number>()
  for (const f of filas) {
    cuentaParentesco.set(f.parentesco, (cuentaParentesco.get(f.parentesco) ?? 0) + 1)
  }
  const porParentesco: ConteoEtiquetado[] = PARENTESCOS_INFORME.map((p) => {
    const cuenta = cuentaParentesco.get(p.valor) ?? 0
    return { clave: p.valor, label: p.label, cuenta, pct: pct(cuenta, total) }
  })

  // Áreas, de mayor a menor.
  const cuentaArea = new Map<string, { label: string; cuenta: number }>()
  for (const f of filas) {
    const clave = normalizar(f.area)
    const prev = cuentaArea.get(clave)
    cuentaArea.set(clave, {
      label: prev?.label ?? f.area,
      cuenta: (prev?.cuenta ?? 0) + 1,
    })
  }
  const porArea: ConteoEtiquetado[] = Array.from(cuentaArea.entries())
    .map(([clave, v]) => ({
      clave,
      label: v.label,
      cuenta: v.cuenta,
      pct: pct(v.cuenta, total),
    }))
    .sort((a, b) => b.cuenta - a.cuenta)

  // Posibles duplicados: el formulario pide un solo registro por colaborador.
  const cuentaNombre = new Map<string, { label: string; cuenta: number }>()
  for (const f of filas) {
    const clave = normalizar(f.colaborador)
    const prev = cuentaNombre.get(clave)
    cuentaNombre.set(clave, {
      label: prev?.label ?? f.colaborador,
      cuenta: (prev?.cuenta ?? 0) + 1,
    })
  }
  const posiblesDuplicados = Array.from(cuentaNombre.values())
    .filter((v) => v.cuenta > 1)
    .map((v) => ({ nombre: v.label, veces: v.cuenta }))
    .sort((a, b) => b.veces - a.veces)

  return {
    totalRegistros: total,
    totalPersonas: total * 2,
    totalAreas: porArea.length,
    porParentesco,
    porArea,
    posiblesDuplicados,
    ultimoRegistro: filas[0]?.createdAt ?? null,
  }
}
