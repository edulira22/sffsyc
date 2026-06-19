"use server"

import { revalidatePath } from "next/cache"

import { requerirRol } from "@/lib/session"
import { ENTIDADES_EXCEL } from "@/lib/excel/columnas"
import {
  leerXlsx,
  cargarContexto,
  procesarFila,
  type ResultadoAnalisis,
} from "@/lib/excel/importar"

const ROLES = ["admin", "coordinacion_general"] as const

// Paso 1: analiza el archivo y devuelve la previsualización (no inserta nada).
export async function analizarImportacion(
  entidad: string,
  formData: FormData
): Promise<ResultadoAnalisis> {
  await requerirRol([...ROLES])

  const vacio: ResultadoAnalisis = {
    ok: false,
    entidad,
    filas: [],
    resumen: { total: 0, nuevas: 0, duplicadas: 0, errores: 0 },
  }

  if (!ENTIDADES_EXCEL[entidad]) return { ...vacio, error: "Entidad no válida" }

  const archivo = formData.get("archivo")
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ...vacio, error: "No se recibió ningún archivo." }
  }

  const buffer = Buffer.from(await archivo.arrayBuffer())
  let lectura
  try {
    lectura = await leerXlsx(buffer, entidad)
  } catch {
    return { ...vacio, error: "No se pudo leer el archivo. ¿Es un Excel (.xlsx) válido?" }
  }

  if (lectura.encabezadosFaltantes.length > 0) {
    return {
      ...vacio,
      error: `Faltan columnas obligatorias: ${lectura.encabezadosFaltantes.join(", ")}. Descarga la plantilla para ver el formato correcto.`,
    }
  }
  if (lectura.filas.length === 0) {
    return { ...vacio, error: "El archivo no tiene filas con datos." }
  }

  const ctx = await cargarContexto(entidad)
  const filas = lectura.filas.map((f) => {
    const r = procesarFila(entidad, f.valores, ctx)
    return {
      numero: f.numero,
      estado: r.estado,
      resumen: r.resumen,
      problemas: r.problemas,
      valores: f.valores,
    }
  })

  const resumen = {
    total: filas.length,
    nuevas: filas.filter((f) => f.estado === "nueva").length,
    duplicadas: filas.filter((f) => f.estado === "duplicada").length,
    errores: filas.filter((f) => f.estado === "error").length,
  }

  return { ok: true, entidad, filas, resumen }
}

// Paso 2: inserta las filas elegidas. Re-procesa cada una en el servidor
// (re-valida y re-verifica duplicados) antes de insertar; nada se confía al cliente.
export async function confirmarImportacion(
  entidad: string,
  valoresFilas: Record<string, string>[]
): Promise<{ ok: boolean; insertadas: number; omitidas: number; errores: number; error?: string }> {
  await requerirRol([...ROLES])

  if (!ENTIDADES_EXCEL[entidad]) {
    return { ok: false, insertadas: 0, omitidas: 0, errores: 0, error: "Entidad no válida" }
  }

  const ctx = await cargarContexto(entidad)
  let insertadas = 0
  let omitidas = 0
  let errores = 0

  for (const valores of valoresFilas) {
    const r = procesarFila(entidad, valores, ctx)
    if (r.estado === "nueva" && r.ejecutar) {
      try {
        await r.ejecutar()
        insertadas++
      } catch {
        errores++
      }
    } else if (r.estado === "duplicada") {
      omitidas++
    } else {
      errores++
    }
  }

  // Refresca las vistas que pudieron cambiar.
  for (const ruta of ["/centros", "/beneficiarios", "/catalogos", "/datos"]) {
    revalidatePath(ruta)
  }

  return { ok: true, insertadas, omitidas, errores }
}
