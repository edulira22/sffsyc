// Carga el acomodo del 5º Informe (bloques, invitados y guía del staff) en la
// base de datos, a partir del paquete generado por el proyecto de layout.
//
//   npx tsx scripts/cargar-acomodo-informe.ts "<ruta>/paquete_plataforma"
//   npx tsx scripts/cargar-acomodo-informe.ts "<ruta>/paquete_plataforma" --reemplazar
//
// Lee:  <ruta>/datos/app_staff_datos.json   (plano + bloques + invitados)
//       <ruta>/pdf/guia_staff.pdf           (se sirve desde la base, no del repo)
//
// Los bloques y el PDF se actualizan siempre (upsert). Los invitados solo se
// cargan si la tabla está vacía; con --reemplazar, los actuales se marcan con
// estatus "reemplazado" (nunca se borran) y se cargan los nuevos. Úsalo solo
// si cambió el Excel: se pierden las correcciones hechas desde el panel.

import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

import { prisma } from "../lib/prisma"

type DatosStaff = {
  bloques: {
    id: string
    lugares: number
    grupos: string
    nota: string
    d: string
    x: number
    y: number
    filas: string[]
  }[]
  invitados: {
    nombre: string
    titulo: string
    cargo: string
    grupo: string
    bloques: string[]
    estado: string
    nota: string
    tejedora: boolean
  }[]
}

const ASISTENCIAS = new Set(["confirmado", "no_asiste", "sin_confirmar"])

async function main() {
  const ruta = process.argv[2]
  const reemplazar = process.argv.includes("--reemplazar")
  if (!ruta) throw new Error("Indica la ruta de paquete_plataforma")

  const rutaJson = join(ruta, "datos", "app_staff_datos.json")
  const rutaPdf = join(ruta, "pdf", "guia_staff.pdf")
  if (!existsSync(rutaJson)) throw new Error(`No existe ${rutaJson}`)

  const D = JSON.parse(readFileSync(rutaJson, "utf8")) as DatosStaff

  // --- Bloques (upsert) ---
  for (let orden = 0; orden < D.bloques.length; orden++) {
    const b = D.bloques[orden]
    const datos = {
      orden,
      lugares: b.lugares,
      grupos: b.grupos ?? "",
      nota: b.nota ?? "",
      d: b.d,
      x: b.x,
      y: b.y,
      filas: b.filas ?? [],
    }
    await prisma.informeBloque.upsert({
      where: { id: b.id },
      create: { id: b.id, ...datos },
      update: datos,
    })
  }
  console.log("Bloques cargados:", D.bloques.length)

  // --- Invitados ---
  const actuales = await prisma.informeInvitado.count({ where: { estatus: "activo" } })
  if (actuales > 0 && !reemplazar) {
    console.log(
      `Invitados: la tabla ya tiene ${actuales} activos; no se tocan.`,
      "Usa --reemplazar solo si cambió el Excel."
    )
  } else {
    if (actuales > 0) {
      const r = await prisma.informeInvitado.updateMany({
        where: { estatus: "activo" },
        data: { estatus: "reemplazado" },
      })
      console.log("Invitados anteriores marcados como reemplazados:", r.count)
    }
    const filas = D.invitados.map((p) => ({
      nombre: p.nombre.trim(),
      titulo: (p.titulo ?? "").trim(),
      cargo: (p.cargo ?? "").trim(),
      grupo: (p.grupo ?? "Sin grupo").trim(),
      bloques: p.bloques ?? [],
      asistencia: ASISTENCIAS.has(p.estado) ? p.estado : "sin_confirmar",
      nota: (p.nota ?? "").trim(),
      tejedora: !!p.tejedora,
    }))
    const r = await prisma.informeInvitado.createMany({ data: filas })
    console.log("Invitados cargados:", r.count)
  }

  // --- Guía del staff (PDF) ---
  if (existsSync(rutaPdf)) {
    const contenido = readFileSync(rutaPdf)
    await prisma.informeArchivo.upsert({
      where: { nombre: "guia_staff" },
      create: { nombre: "guia_staff", tipo: "application/pdf", contenido },
      update: { tipo: "application/pdf", contenido },
    })
    console.log("Guía del staff cargada:", Math.round(contenido.length / 1024), "KB")
  } else {
    console.log("AVISO: no se encontró", rutaPdf)
  }

  // --- Resumen ---
  const activos = await prisma.informeInvitado.findMany({
    where: { estatus: "activo" },
    select: { asistencia: true, tejedora: true },
  })
  const conteo: Record<string, number> = {}
  for (const a of activos) conteo[a.asistencia] = (conteo[a.asistencia] ?? 0) + 1
  console.log("Invitados activos:", activos.length, conteo, "· tejedoras:", activos.filter((a) => a.tejedora).length)
}

main()
  .catch((e) => {
    console.error("FALLO:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
