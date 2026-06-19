import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "eduardolid20@gmail.com"
  const passwordHash = await bcrypt.hash("DIF123", 12)

  const u = await prisma.usuarioSistema.upsert({
    where: { email },
    update: { passwordHash, estatus: "activo", rol: "admin" },
    create: {
      nombre: "Eduardo",
      email,
      passwordHash,
      rol: "admin",
      estatus: "activo",
    },
  })

  console.log(`✅ Usuario listo: ${u.email} (rol ${u.rol})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
