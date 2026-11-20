import { z } from "zod"

import { CATEGORIAS, normalizarPrefijo } from "@/lib/entregas/catalogos"

const texto = (max: number) =>
  z
    .string()
    .max(max, "El texto es demasiado largo")
    .transform((s) => s.replace(/[ \t]+/g, " ").trim())

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const fechaOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || FECHA.test(v), "Fecha inválida")
  .transform((v) => (v === "" ? null : v))

/** "" → null; si no, entero ≥ 0. */
const cantidad = z
  .string()
  .transform((v) => v.replace(/[^\d]/g, ""))
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v <= 1_000_000), "Cantidad inválida")

export const campanaSchema = z
  .object({
    nombre: texto(120).refine((s) => s.length >= 3, "Escribe el nombre de la entrega"),
    anio: z.coerce.number().int().min(2020, "Año inválido").max(2100, "Año inválido"),
    prefijo: z
      .string()
      .transform(normalizarPrefijo)
      .refine((p) => p.length >= 2, "El prefijo del folio debe tener al menos 2 letras"),
    descripcion: texto(500),
    articulos: z
      .array(
        z.object({
          clave: z.string().default(""),
          nombre: texto(80).refine((s) => s.length > 0, "Cada artículo necesita nombre"),
          disponible: cantidad,
        })
      )
      .min(1, "Agrega al menos un artículo (p. ej. bolsitas de dulces)"),
  })
  .refine((d) => new Set(d.articulos.map((a) => a.nombre.toLowerCase())).size === d.articulos.length, {
    message: "Hay artículos repetidos",
    path: ["articulos"],
  })
export type CampanaInput = z.input<typeof campanaSchema>

export const solicitudSchema = z.object({
  fechaSolicitud: fechaOpcional,
  fechaEvento: fechaOpcional,
  categoria: z.string().refine((v) => CATEGORIAS.some((c) => c.valor === v), "Categoría inválida"),
  solicitante: texto(160),
  cargo: texto(160),
  organizacion: texto(200),
  resumen: texto(1000),
  contacto: texto(300),
  observaciones: texto(1000),
  solicitado: z.record(z.string(), cantidad),
  autorizado: z.record(z.string(), cantidad),
})
export type SolicitudInput = z.input<typeof solicitudSchema>
