import { prisma } from "@/lib/prisma"

// TEMPORAL: mide la latencia a la base (5 consultas vacías, sin datos). Se quita al terminar.
export const dynamic = "force-dynamic"
export async function GET() {
  const tiempos: number[] = []
  for (let i = 0; i < 5; i++) {
    const t = performance.now()
    await prisma.$queryRaw`SELECT 1`
    tiempos.push(Math.round(performance.now() - t))
  }
  return Response.json({ region: process.env.VERCEL_REGION ?? "local", ms: tiempos })
}
