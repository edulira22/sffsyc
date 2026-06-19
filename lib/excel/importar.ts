import ExcelJS from "exceljs"

import { prisma } from "@/lib/prisma"
import { ENTIDADES_EXCEL } from "@/lib/excel/columnas"
import { formatoFecha } from "@/lib/fechas"
import { ESCOLARIDAD_LABEL, ESCOLARIDADES } from "@/lib/schemas/beneficiario"

// =============================================================================
//  Motor de importación de Excel.
//  Lee una hoja, valida cada fila contra el formato ideal, resuelve las
//  referencias legibles (zona, categoría, centro, clase, beneficiario por CURP)
//  a llaves internas, y clasifica cada fila: nueva | duplicada | error.
//  No inserta nada hasta que se confirma.
// =============================================================================

export type EstadoFila = "nueva" | "duplicada" | "error"

export type FilaAnalizada = {
  numero: number
  estado: EstadoFila
  resumen: string
  problemas: string[]
  valores: Record<string, string>
}

export type ResultadoAnalisis = {
  ok: boolean
  error?: string
  entidad: string
  filas: FilaAnalizada[]
  resumen: { total: number; nuevas: number; duplicadas: number; errores: number }
}

// --- Utilidades de texto/fecha ----------------------------------------------

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

function valorCelda(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ""
  if (v instanceof Date) return formatoFecha(v)
  if (typeof v === "object") return String(cell.text ?? "").trim()
  return String(v).trim()
}

/** Convierte dd/mm/aaaa o aaaa-mm-dd a ISO (aaaa-mm-dd) válido, o null. */
function parseFechaISO(s: string): string | null {
  const t = s.trim()
  let y: number, mo: number, d: number
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    d = Number(m[1]); mo = Number(m[2]); y = Number(m[3])
  } else if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    y = Number(m[1]); mo = Number(m[2]); d = Number(m[3])
  } else {
    return null
  }
  const fecha = new Date(Date.UTC(y, mo - 1, d))
  if (
    fecha.getUTCFullYear() !== y ||
    fecha.getUTCMonth() !== mo - 1 ||
    fecha.getUTCDate() !== d
  ) {
    return null
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

// --- Lectura del archivo -----------------------------------------------------

export async function leerXlsx(buffer: Buffer, entidadId: string) {
  const entidad = ENTIDADES_EXCEL[entidadId]
  const wb = new ExcelJS.Workbook()
  // Cast por el choque entre el Buffer genérico de @types/node y el de exceljs.
  await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0])
  const ws = wb.worksheets[0]
  if (!ws) {
    return { encabezadosFaltantes: ["(hoja vacía)"], filas: [] }
  }

  const mapaEnc = new Map(
    entidad.columnas.map((c) => [normalizar(c.encabezado), c.clave])
  )
  const colClave: Record<number, string> = {}
  ws.getRow(1).eachCell((cell, col) => {
    const clave = mapaEnc.get(normalizar(String(cell.text ?? "")))
    if (clave) colClave[col] = clave
  })

  const presentes = new Set(Object.values(colClave))
  const encabezadosFaltantes = entidad.columnas
    .filter((c) => c.requerida && !presentes.has(c.clave))
    .map((c) => c.encabezado)

  const filas: { numero: number; valores: Record<string, string> }[] = []
  ws.eachRow((row, n) => {
    if (n === 1) return
    const valores: Record<string, string> = {}
    let vacia = true
    for (const [colStr, clave] of Object.entries(colClave)) {
      const txt = valorCelda(row.getCell(Number(colStr)))
      valores[clave] = txt
      if (txt) vacia = false
    }
    if (!vacia) filas.push({ numero: n, valores })
  })

  return { encabezadosFaltantes, filas }
}

// --- Contexto (lookups precargados) -----------------------------------------

export type Contexto = {
  zonas: Map<string, number>
  categorias: Map<string, number>
  coordinadorasCentro: Map<string, number>
  centros: Map<string, number>
  claseCentro: Map<string, number> // `${centroNombre}|${claseNombre}` -> claseCentroId
  beneficiariosPorCurp: Map<string, number>
  beneficiariosPorNombre: Map<string, number>
  // Sets de duplicados (se mutan al aceptar filas, también dentro del mismo lote)
  existeCoordinadora: Set<string>
  existeClase: Set<string>
  existeProfesor: Set<string>
  existeCentro: Set<string>
  inscripcionActiva: Set<string> // `${beneficiarioId}|${claseCentroId}`
}

export async function cargarContexto(entidadId: string): Promise<Contexto> {
  const ctx: Contexto = {
    zonas: new Map(),
    categorias: new Map(),
    coordinadorasCentro: new Map(),
    centros: new Map(),
    claseCentro: new Map(),
    beneficiariosPorCurp: new Map(),
    beneficiariosPorNombre: new Map(),
    existeCoordinadora: new Set(),
    existeClase: new Set(),
    existeProfesor: new Set(),
    existeCentro: new Set(),
    inscripcionActiva: new Set(),
  }

  const zonas = await prisma.zona.findMany()
  for (const z of zonas) ctx.zonas.set(normalizar(z.nombre), z.id)

  if (entidadId === "coordinadoras") {
    const cs = await prisma.coordinadora.findMany()
    for (const c of cs) {
      ctx.existeCoordinadora.add(
        normalizar(`${c.nombre}|${c.apellidoPaterno}|${c.rol}`)
      )
    }
  }

  if (entidadId === "clases") {
    const [cats, clases] = await Promise.all([
      prisma.catalogoCategoria.findMany(),
      prisma.catalogoClase.findMany(),
    ])
    for (const c of cats) ctx.categorias.set(normalizar(c.nombre), c.id)
    for (const c of clases) ctx.existeClase.add(normalizar(c.nombreOficial))
  }

  if (entidadId === "profesores") {
    const ps = await prisma.profesor.findMany()
    for (const p of ps)
      ctx.existeProfesor.add(normalizar(`${p.nombre}|${p.apellidoPaterno}`))
  }

  if (entidadId === "centros") {
    const [coords, centros] = await Promise.all([
      prisma.coordinadora.findMany({ where: { rol: "centro" } }),
      prisma.centro.findMany(),
    ])
    for (const c of coords)
      ctx.coordinadorasCentro.set(
        normalizar(`${c.nombre} ${c.apellidoPaterno}`),
        c.id
      )
    for (const c of centros)
      ctx.existeCentro.add(normalizar(`${c.nombre}|${c.zonaId}`))
  }

  if (entidadId === "beneficiarios") {
    const bs = await prisma.beneficiario.findMany()
    for (const b of bs) {
      if (b.curp) ctx.beneficiariosPorCurp.set(b.curp.toUpperCase(), b.id)
      ctx.beneficiariosPorNombre.set(
        normalizar(
          `${b.apellidoPaterno}|${b.apellidoMaterno ?? ""}|${b.nombres}|${b.fechaNacimiento.toISOString().slice(0, 10)}`
        ),
        b.id
      )
    }
  }

  if (entidadId === "inscripciones") {
    const [bs, ccs, ins] = await Promise.all([
      prisma.beneficiario.findMany(),
      prisma.claseCentro.findMany({
        where: { estatus: "activa" },
        include: { centro: true, clase: true },
      }),
      prisma.inscripcion.findMany({ where: { estatus: "activa" } }),
    ])
    for (const b of bs) {
      if (b.curp) ctx.beneficiariosPorCurp.set(b.curp.toUpperCase(), b.id)
      ctx.beneficiariosPorNombre.set(
        normalizar(
          `${b.apellidoPaterno}||${b.nombres}|${b.fechaNacimiento.toISOString().slice(0, 10)}`
        ),
        b.id
      )
    }
    for (const cc of ccs) {
      ctx.claseCentro.set(
        normalizar(`${cc.centro.nombre}|${cc.clase.nombreOficial}`),
        cc.id
      )
    }
    for (const i of ins)
      ctx.inscripcionActiva.add(`${i.beneficiarioId}|${i.claseCentroId}`)
  }

  return ctx
}

// --- Vocabularios controlados (reversos, tolerantes a may/min y acentos) -----

const ROL_COORD = new Map<string, "general" | "zona" | "centro">([
  ["general", "general"],
  ["zona", "zona"],
  ["centro", "centro"],
  ["coordinacion general", "general"],
  ["coordinadora de zona", "zona"],
  ["coordinadora de centro", "centro"],
])

const TIPO_CENTRO = new Map<string, "centro_comunitario" | "cedefam" | "stem">([
  ["centro comunitario", "centro_comunitario"],
  ["centro_comunitario", "centro_comunitario"],
  ["cedefam", "cedefam"],
  ["stem", "stem"],
])

const ESTATUS_CENTRO = new Map<string, "activo" | "inactivo" | "pendiente">([
  ["activo", "activo"],
  ["inactivo", "inactivo"],
  ["pendiente", "pendiente"],
])

function resolverEscolaridad(v: string): string | null | "error" {
  if (!v.trim()) return null
  const n = normalizar(v)
  for (const e of ESCOLARIDADES) {
    if (normalizar(e) === n || normalizar(ESCOLARIDAD_LABEL[e]) === n) return e
  }
  return "error"
}

// --- Procesamiento de una fila ----------------------------------------------

export type ResultadoFila = {
  estado: EstadoFila
  resumen: string
  problemas: string[]
  ejecutar?: () => Promise<void>
}

export function procesarFila(
  entidadId: string,
  v: Record<string, string>,
  ctx: Contexto
): ResultadoFila {
  const problemas: string[] = []
  const req = (clave: string, etiqueta: string) => {
    if (!v[clave]?.trim()) problemas.push(`Falta ${etiqueta}`)
  }

  switch (entidadId) {
    case "coordinadoras": {
      req("nombre", "el nombre")
      req("apellidoPaterno", "el apellido paterno")
      const rol = ROL_COORD.get(normalizar(v.rol ?? ""))
      if (!v.rol?.trim()) problemas.push("Falta el rol")
      else if (!rol) problemas.push(`Rol no válido: "${v.rol}" (general, zona o centro)`)
      let zonaId: number | null = null
      if (rol === "zona") {
        if (!v.zona?.trim()) problemas.push("La coordinadora de zona requiere una zona")
        else {
          const z = ctx.zonas.get(normalizar(v.zona))
          if (!z) problemas.push(`Zona no encontrada: "${v.zona}"`)
          else zonaId = z
        }
      }
      const resumen = `${v.nombre ?? ""} ${v.apellidoPaterno ?? ""}`.trim()
      if (problemas.length) return { estado: "error", resumen, problemas }
      const clave = normalizar(`${v.nombre}|${v.apellidoPaterno}|${rol}`)
      if (ctx.existeCoordinadora.has(clave))
        return { estado: "duplicada", resumen, problemas: ["Ya existe una coordinadora con ese nombre y rol"] }
      ctx.existeCoordinadora.add(clave)
      return {
        estado: "nueva",
        resumen,
        problemas: [],
        ejecutar: async () => {
          await prisma.coordinadora.create({
            data: {
              nombre: v.nombre.trim(),
              apellidoPaterno: v.apellidoPaterno.trim(),
              apellidoMaterno: v.apellidoMaterno?.trim() || null,
              telefono: v.telefono?.trim() || null,
              rol: rol!,
              zonaId,
            },
          })
        },
      }
    }

    case "clases": {
      req("nombreOficial", "el nombre oficial")
      req("categoria", "la categoría")
      let categoriaId: number | null = null
      if (v.categoria?.trim()) {
        const c = ctx.categorias.get(normalizar(v.categoria))
        if (!c) problemas.push(`Categoría no encontrada: "${v.categoria}"`)
        else categoriaId = c
      }
      const resumen = v.nombreOficial ?? ""
      if (problemas.length) return { estado: "error", resumen, problemas }
      const clave = normalizar(v.nombreOficial)
      if (ctx.existeClase.has(clave))
        return { estado: "duplicada", resumen, problemas: ["Ya existe una clase con ese nombre"] }
      ctx.existeClase.add(clave)
      return {
        estado: "nueva",
        resumen,
        problemas: [],
        ejecutar: async () => {
          await prisma.catalogoClase.create({
            data: {
              nombreOficial: v.nombreOficial.trim(),
              categoriaId: categoriaId!,
              variantesAlias: v.variantesAlias?.trim() || null,
              descripcion: v.descripcion?.trim() || null,
            },
          })
        },
      }
    }

    case "profesores": {
      req("nombre", "el nombre")
      req("apellidoPaterno", "el apellido paterno")
      const resumen = `${v.nombre ?? ""} ${v.apellidoPaterno ?? ""}`.trim()
      if (problemas.length) return { estado: "error", resumen, problemas }
      const clave = normalizar(`${v.nombre}|${v.apellidoPaterno}`)
      if (ctx.existeProfesor.has(clave))
        return { estado: "duplicada", resumen, problemas: ["Ya existe un profesor con ese nombre"] }
      ctx.existeProfesor.add(clave)
      return {
        estado: "nueva",
        resumen,
        problemas: [],
        ejecutar: async () => {
          await prisma.profesor.create({
            data: {
              nombre: v.nombre.trim(),
              apellidoPaterno: v.apellidoPaterno.trim(),
              apellidoMaterno: v.apellidoMaterno?.trim() || null,
              telefono: v.telefono?.trim() || null,
              especialidad: v.especialidad?.trim() || null,
              observaciones: v.observaciones?.trim() || null,
            },
          })
        },
      }
    }

    case "centros": {
      req("nombre", "el nombre")
      const tipo = TIPO_CENTRO.get(normalizar(v.tipo ?? ""))
      if (!v.tipo?.trim()) problemas.push("Falta el tipo")
      else if (!tipo) problemas.push(`Tipo no válido: "${v.tipo}" (Centro comunitario, CEDEFAM o STEM)`)
      let zonaId: number | null = null
      if (!v.zona?.trim()) problemas.push("Falta la zona")
      else {
        const z = ctx.zonas.get(normalizar(v.zona))
        if (!z) problemas.push(`Zona no encontrada: "${v.zona}"`)
        else zonaId = z
      }
      let coordinadoraId: number | null = null
      if (v.coordinadora?.trim()) {
        const c = ctx.coordinadorasCentro.get(normalizar(v.coordinadora))
        if (!c) problemas.push(`Coordinadora de centro no encontrada: "${v.coordinadora}"`)
        else coordinadoraId = c
      }
      let estatus: "activo" | "inactivo" | "pendiente" = "activo"
      if (v.estatus?.trim()) {
        const e = ESTATUS_CENTRO.get(normalizar(v.estatus))
        if (!e) problemas.push(`Estatus no válido: "${v.estatus}"`)
        else estatus = e
      }
      const resumen = v.nombre ?? ""
      if (problemas.length) return { estado: "error", resumen, problemas }
      const clave = normalizar(`${v.nombre}|${zonaId}`)
      if (ctx.existeCentro.has(clave))
        return { estado: "duplicada", resumen, problemas: ["Ya existe un centro con ese nombre en esa zona"] }
      ctx.existeCentro.add(clave)
      return {
        estado: "nueva",
        resumen,
        problemas: [],
        ejecutar: async () => {
          await prisma.centro.create({
            data: {
              nombre: v.nombre.trim(),
              tipo: tipo!,
              zonaId: zonaId!,
              coordinadoraId,
              estatus,
              direccion: v.direccion?.trim() || null,
              referenciaUbicacion: v.referenciaUbicacion?.trim() || null,
              horarioGeneral: v.horarioGeneral?.trim() || null,
              observaciones: v.observaciones?.trim() || null,
            },
          })
        },
      }
    }

    case "beneficiarios": {
      req("apellidoPaterno", "el apellido paterno")
      req("nombres", "el nombre")
      let fechaISO: string | null = null
      if (!v.fechaNacimiento?.trim()) problemas.push("Falta la fecha de nacimiento")
      else {
        fechaISO = parseFechaISO(v.fechaNacimiento)
        if (!fechaISO) problemas.push(`Fecha de nacimiento no válida: "${v.fechaNacimiento}" (usa dd/mm/aaaa)`)
      }
      const curp = v.curp?.trim().toUpperCase() || ""
      if (curp && !/^[A-Z0-9]{18}$/.test(curp))
        problemas.push("La CURP debe tener 18 caracteres")
      const escolaridad = resolverEscolaridad(v.escolaridad ?? "")
      if (escolaridad === "error") problemas.push(`Escolaridad no válida: "${v.escolaridad}"`)
      const resumen = `${v.nombres ?? ""} ${v.apellidoPaterno ?? ""}`.trim()
      if (problemas.length) return { estado: "error", resumen, problemas }

      // Duplicado por CURP o por nombre completo + fecha.
      const claveNombre = normalizar(
        `${v.apellidoPaterno}|${v.apellidoMaterno ?? ""}|${v.nombres}|${fechaISO}`
      )
      if (curp && ctx.beneficiariosPorCurp.has(curp))
        return { estado: "duplicada", resumen, problemas: ["Ya existe un beneficiario con esa CURP"] }
      if (ctx.beneficiariosPorNombre.has(claveNombre))
        return { estado: "duplicada", resumen, problemas: ["Ya existe un beneficiario con ese nombre y fecha de nacimiento"] }
      if (curp) ctx.beneficiariosPorCurp.set(curp, -1)
      ctx.beneficiariosPorNombre.set(claveNombre, -1)

      const esc = escolaridad as string | null
      const aplicaEscuela = !!esc && esc !== "universidad" && esc !== "sin_escolaridad"
      return {
        estado: "nueva",
        resumen,
        problemas: [],
        ejecutar: async () => {
          await prisma.beneficiario.create({
            data: {
              apellidoPaterno: v.apellidoPaterno.trim(),
              apellidoMaterno: v.apellidoMaterno?.trim() || null,
              nombres: v.nombres.trim(),
              fechaNacimiento: new Date(fechaISO!),
              curp: curp || null,
              telefono: v.telefono?.trim() || null,
              domicilio: v.domicilio?.trim() || null,
              escolaridad: (esc as never) ?? null,
              gradoEscolar: aplicaEscuela ? v.gradoEscolar?.trim() || null : null,
              nombreEscuela: aplicaEscuela ? v.nombreEscuela?.trim() || null : null,
              observaciones: v.observaciones?.trim() || null,
            },
          })
        },
      }
    }

    case "inscripciones": {
      // Resolver beneficiario por CURP o por nombre+fecha.
      let beneficiarioId: number | undefined
      const curp = v.curp?.trim().toUpperCase() || ""
      if (curp) beneficiarioId = ctx.beneficiariosPorCurp.get(curp)
      if (!beneficiarioId && v.apellidoPaterno?.trim() && v.nombres?.trim()) {
        const fISO = parseFechaISO(v.fechaNacimiento ?? "")
        if (fISO) {
          beneficiarioId = ctx.beneficiariosPorNombre.get(
            normalizar(`${v.apellidoPaterno}||${v.nombres}|${fISO}`)
          )
        }
      }
      if (!beneficiarioId)
        problemas.push("No se encontró el beneficiario (revisa CURP o nombre + fecha)")

      let claseCentroId: number | undefined
      if (!v.centro?.trim()) problemas.push("Falta el centro")
      if (!v.clase?.trim()) problemas.push("Falta la clase")
      if (v.centro?.trim() && v.clase?.trim()) {
        claseCentroId = ctx.claseCentro.get(normalizar(`${v.centro}|${v.clase}`))
        if (!claseCentroId)
          problemas.push(`No hay una clase activa "${v.clase}" en el centro "${v.centro}"`)
      }

      let fechaISO = parseFechaISO(v.fechaInscripcion ?? "")
      if (v.fechaInscripcion?.trim() && !fechaISO)
        problemas.push(`Fecha de inscripción no válida: "${v.fechaInscripcion}"`)
      if (!fechaISO) fechaISO = new Date().toISOString().slice(0, 10)

      const resumen = `${v.nombres ?? curp} → ${v.clase ?? ""}`.trim()
      if (problemas.length) return { estado: "error", resumen, problemas }

      const claveIns = `${beneficiarioId}|${claseCentroId}`
      if (ctx.inscripcionActiva.has(claveIns))
        return { estado: "duplicada", resumen, problemas: ["El beneficiario ya está inscrito en esa clase"] }
      ctx.inscripcionActiva.add(claveIns)
      const fechaFinal = fechaISO
      return {
        estado: "nueva",
        resumen,
        problemas: [],
        ejecutar: async () => {
          await prisma.inscripcion.create({
            data: {
              beneficiarioId: beneficiarioId!,
              claseCentroId: claseCentroId!,
              fechaInscripcion: new Date(fechaFinal),
            },
          })
        },
      }
    }

    default:
      return { estado: "error", resumen: "", problemas: ["Entidad no válida"] }
  }
}
