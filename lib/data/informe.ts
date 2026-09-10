import { prisma } from "@/lib/prisma"
import {
  PARENTESCOS_INFORME,
  type InvitadoInforme,
} from "@/lib/eventos/informe"

// Consultas de solo lectura del registro de asistencia al Informe.

export async function listarRegistrosInforme() {
  const filas = await prisma.registroInforme.findMany({
    where: { estatus: "activo" },
    orderBy: { createdAt: "desc" },
  })
  return filas.map((f) => ({
    id: f.id,
    colaborador: f.colaborador,
    area: f.area,
    invitados: (f.invitados as unknown as InvitadoInforme[]) ?? [],
    createdAt: f.createdAt,
  }))
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
  /** Envíos del formulario. Puede ser mayor que las personas si hay duplicados. */
  totalRegistros: number
  /** Personas distintas que se registraron, sin contar duplicados. */
  colaboradoresDistintos: number
  /** Familiares invitados sumando todos los registros. */
  totalInvitados: number
  /**
   * Personas esperadas. Se cuentan los colaboradores DISTINTOS (por si alguien
   * llenó el formulario dos veces) más el total de invitados, para que la cifra
   * sirva de verdad para sillas y alimentos.
   */
  totalPersonas: number
  totalAreas: number
  /** Promedio de invitados por registro, con un decimal. */
  promedioInvitados: number
  porParentesco: ConteoEtiquetado[]
  porArea: ConteoEtiquetado[]
  /** Nombres de colaborador que aparecen en más de un registro. */
  posiblesDuplicados: { nombre: string; veces: number }[]
  ultimoRegistro: Date | null
}

function pct(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100)
}

/** Clave para comparar nombres ignorando acentos, mayúsculas y espacios. */
function normalizar(s: string): string {
  // ̀-ͯ = marcas diacriticas combinantes que deja NFD.
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export async function obtenerResumenInforme(): Promise<ResumenInforme> {
  const filas = await listarRegistrosInforme()
  const total = filas.length
  const todosLosInvitados = filas.flatMap((f) => f.invitados)
  const totalInvitados = todosLosInvitados.length

  // Parentescos: se cuentan sobre el total de invitados, no de registros.
  const cuentaParentesco = new Map<string, number>()
  for (const inv of todosLosInvitados) {
    cuentaParentesco.set(
      inv.parentesco,
      (cuentaParentesco.get(inv.parentesco) ?? 0) + 1
    )
  }
  const porParentesco: ConteoEtiquetado[] = PARENTESCOS_INFORME.map((p) => {
    const cuenta = cuentaParentesco.get(p.valor) ?? 0
    return {
      clave: p.valor,
      label: p.label,
      cuenta,
      pct: pct(cuenta, totalInvitados),
    }
  })

  // Áreas: cuentan personas (colaborador + sus invitados), que es lo útil
  // para saber cuánta gente llega de cada área.
  const cuentaArea = new Map<string, { label: string; cuenta: number }>()
  for (const f of filas) {
    const clave = normalizar(f.area)
    const prev = cuentaArea.get(clave)
    cuentaArea.set(clave, {
      label: prev?.label ?? f.area,
      cuenta: (prev?.cuenta ?? 0) + 1 + f.invitados.length,
    })
  }
  const totalPersonasArea = Array.from(cuentaArea.values()).reduce(
    (a, v) => a + v.cuenta,
    0
  )
  const porArea: ConteoEtiquetado[] = Array.from(cuentaArea.entries())
    .map(([clave, v]) => ({
      clave,
      label: v.label,
      cuenta: v.cuenta,
      pct: pct(v.cuenta, totalPersonasArea),
    }))
    .sort((a, b) => b.cuenta - a.cuenta)

  // Colaboradores distintos y posibles duplicados.
  const cuentaNombre = new Map<string, { label: string; cuenta: number }>()
  for (const f of filas) {
    const clave = normalizar(f.colaborador)
    const prev = cuentaNombre.get(clave)
    cuentaNombre.set(clave, {
      label: prev?.label ?? f.colaborador,
      cuenta: (prev?.cuenta ?? 0) + 1,
    })
  }
  const colaboradoresDistintos = cuentaNombre.size
  const posiblesDuplicados = Array.from(cuentaNombre.values())
    .filter((v) => v.cuenta > 1)
    .map((v) => ({ nombre: v.label, veces: v.cuenta }))
    .sort((a, b) => b.veces - a.veces)

  return {
    totalRegistros: total,
    colaboradoresDistintos,
    totalInvitados,
    totalPersonas: colaboradoresDistintos + totalInvitados,
    totalAreas: cuentaArea.size,
    // Por persona, no por envío, para que no lo distorsionen los duplicados.
    promedioInvitados:
      colaboradoresDistintos === 0
        ? 0
        : Math.round((totalInvitados / colaboradoresDistintos) * 10) / 10,
    porParentesco,
    porArea,
    posiblesDuplicados,
    ultimoRegistro: filas[0]?.createdAt ?? null,
  }
}
