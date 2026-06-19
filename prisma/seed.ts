// =============================================================================
//  Seed inicial — SFFSyC
//  Inserta los datos base imprescindibles para arrancar el sistema:
//    · Las 4 zonas fijas
//    · Las 5 categorías de clase base
//    · 1 usuario administrador
//  Es idempotente: se puede correr varias veces sin duplicar datos.
// =============================================================================

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Sembrando datos iniciales...")

  // --- 1. Zonas (4 fijas) ----------------------------------------------------
  const zonas = ["Norte A", "Norte B", "Sur A", "Sur B"]
  for (const nombre of zonas) {
    await prisma.zona.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }
  console.log(`   ✓ ${zonas.length} zonas`)

  // --- 2. Categorías de clase ------------------------------------------------
  const categorias = ["Deportes", "Arte", "Cultura", "Salud", "Computación"]
  for (const nombre of categorias) {
    await prisma.catalogoCategoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }
  console.log(`   ✓ ${categorias.length} categorías`)

  // --- 3. Usuario administrador ----------------------------------------------
  const adminEmail = "admin@dif.chihuahua.gob.mx"
  const passwordHash = await bcrypt.hash("Admin2024!", 12)
  await prisma.usuarioSistema.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nombre: "Administrador del Sistema",
      email: adminEmail,
      passwordHash,
      rol: "admin",
      estatus: "activo",
    },
  })
  console.log(`   ✓ Usuario administrador (${adminEmail})`)

  console.log("✅ Seed completado.")
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
