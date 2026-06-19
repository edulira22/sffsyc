import { z } from "zod"

export const centroSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del centro es obligatorio"),
  tipo: z.enum(["centro_comunitario", "cedefam", "stem"], {
    message: "Selecciona el tipo de centro",
  }),
  zonaId: z
    .number({ message: "Selecciona una zona" })
    .int()
    .positive("Selecciona una zona"),
  coordinadoraId: z.number().int().positive().nullable().optional(),
  estatus: z.enum(["activo", "inactivo", "pendiente"]),
  direccion: z.string().trim().optional().or(z.literal("")),
  referenciaUbicacion: z.string().trim().optional().or(z.literal("")),
  horarioGeneral: z.string().trim().optional().or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
})

export type CentroInput = z.infer<typeof centroSchema>

export const TIPO_CENTRO_LABEL: Record<
  "centro_comunitario" | "cedefam" | "stem",
  string
> = {
  centro_comunitario: "Centro comunitario",
  cedefam: "CEDEFAM",
  stem: "STEM",
}

export const ESTATUS_CENTRO_LABEL: Record<
  "activo" | "inactivo" | "pendiente",
  string
> = {
  activo: "Activo",
  inactivo: "Inactivo",
  pendiente: "Pendiente",
}
