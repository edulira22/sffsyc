// Carga oficios históricos preparados fuera del repo (bitácora de Google Sheets
// + escaneos ya comprimidos). Uso:
//   npx tsx scripts/importar-oficios-historicos.ts <carpeta>            (simulación)
//   npx tsx scripts/importar-oficios-historicos.ts <carpeta> --aplicar
// <carpeta> contiene datos.json ({ anio, registros[] }) y los archivos que cita.
// Los oficios que ya existían en ese año con un consecutivo ocupado se recorren
// al final, para que los históricos conserven el orden de la bitácora.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"

import { folioOficio } from "../lib/oficios/catalogos"

type Registro = {
  idBitacora: string
  consecutivo: number
  fechaRecepcion: string
  numeroOficio: string
  remitente: string
  dependencia: string
  asunto: string
  resumen: string
  tipo: string
  areaResponsable: string
  prioridad: string
  estado: string
  estadoBitacora: string
  revisado: boolean
  anulado: boolean
  conDatos: boolean
  archivo: { ruta: string; nombreOriginal: string; tipo: string; tamano: number } | null
}

const prisma = new PrismaClient()
const [carpeta, bandera] = process.argv.slice(2)
const aplicar = bandera === "--aplicar"

async function main() {
  if (!carpeta) throw new Error("Falta la carpeta con datos.json")
  const { anio, registros } = JSON.parse(readFileSync(join(carpeta, "datos.json"), "utf8")) as {
    anio: number
    registros: Registro[]
  }
  const origen = `Importación bitácora ${anio}`

  const yaImportados = await prisma.oficio.count({ where: { anio, creadoPorNombre: origen } })
  if (yaImportados > 0) throw new Error(`La bitácora ${anio} ya se importó (${yaImportados} oficios).`)

  const n = registros.length
  const ocupados = await prisma.oficio.findMany({
    where: { anio, consecutivo: { lte: n } },
    orderBy: { consecutivo: "asc" },
    select: { id: true, consecutivo: true },
  })
  const maximo = (await prisma.oficio.aggregate({ where: { anio }, _max: { consecutivo: true } }))._max.consecutivo ?? 0
  let siguiente = Math.max(n, maximo) + 1

  console.log(`${anio}: ${n} oficios a importar; ${ocupados.length} existentes se recorren al final.`)
  if (!aplicar) {
    console.log("Simulación: agrega --aplicar para escribir en la base de datos.")
    return
  }

  for (const o of ocupados) {
    const nuevo = siguiente++
    await prisma.oficio.update({
      where: { id: o.id },
      data: {
        consecutivo: nuevo,
        movimientos: {
          create: {
            tipo: "edicion",
            descripcion: `Folio cambiado de ${folioOficio(anio, o.consecutivo)} a ${folioOficio(anio, nuevo)} al importar la bitácora histórica ${anio}.`,
            usuarioNombre: origen,
          },
        },
      },
    })
  }

  let hechos = 0
  for (const r of registros) {
    const fecha = new Date(`${r.fechaRecepcion}T00:00:00Z`)
    const movimientos = [
      {
        tipo: "registro",
        descripcion:
          `Importado de la bitácora ${anio} (Google Sheets). ID original: ${r.idBitacora}.` +
          (r.estadoBitacora ? ` Estado en la bitácora: ${r.estadoBitacora}.` : "") +
          (r.conDatos || r.anulado ? "" : " Sin datos capturados en la bitácora."),
        usuarioNombre: origen,
        createdAt: fecha,
      },
      ...(r.anulado
        ? [{ tipo: "anulacion", descripcion: "Registro anulado: marcado como anulado o duplicado en la bitácora.", usuarioNombre: origen, createdAt: fecha }]
        : []),
    ]
    await prisma.oficio.create({
      data: {
        anio,
        consecutivo: r.consecutivo,
        numeroOficio: r.numeroOficio,
        numeroRecepcion: r.idBitacora,
        fechaRecepcion: fecha,
        remitente: r.remitente,
        dependencia: r.dependencia,
        tipo: r.tipo,
        asunto: r.asunto,
        resumen: r.resumen,
        areaResponsable: r.areaResponsable,
        prioridad: r.prioridad,
        estado: r.estado,
        revisado: r.revisado,
        iaEstado: r.conDatos ? "sin_ia" : "pendiente",
        creadoPorNombre: origen,
        estatus: r.anulado ? "baja" : "activo",
        movimientos: { create: movimientos },
        ...(r.archivo
          ? {
              archivo: {
                create: {
                  nombreOriginal: r.archivo.nombreOriginal,
                  tipo: r.archivo.tipo,
                  tamano: r.archivo.tamano,
                  contenido: readFileSync(join(carpeta, r.archivo.ruta)),
                },
              },
            }
          : {}),
      },
    })
    if (++hechos % 25 === 0) console.log(`  ${hechos}/${n}`)
  }
  console.log(`Listo: ${hechos} oficios de ${anio}.`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
