import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// Métricas del dashboard. Si se pasa zonaId (coordinadora de zona), todo se
// limita a esa zona.
export async function metricasDashboard(zonaId?: number) {
  const filtroCentroZona: Prisma.CentroWhereInput = zonaId ? { zonaId } : {}
  const enZona = zonaId ? { claseCentro: { centro: { zonaId } } } : {}

  const [centrosActivos, clasesActivas, beneficiariosActivos, ultimos] =
    await Promise.all([
      prisma.centro.count({ where: { estatus: "activo", ...filtroCentroZona } }),
      prisma.claseCentro.count({
        where: { estatus: "activa", ...(zonaId ? { centro: { zonaId } } : {}) },
      }),
      prisma.beneficiario.count({
        where: {
          estatus: "activo",
          ...(zonaId
            ? { inscripciones: { some: { estatus: "activa", ...enZona } } }
            : {}),
        },
      }),
      prisma.beneficiario.findMany({
        where: zonaId
          ? { inscripciones: { some: enZona } }
          : {},
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

  return { centrosActivos, clasesActivas, beneficiariosActivos, ultimos }
}
