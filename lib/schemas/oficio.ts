import { z } from "zod"

import {
  AREAS_OFICIO,
  PRIORIDADES_OFICIO,
  TIPOS_OFICIO,
  valores,
} from "@/lib/oficios/catalogos"

const texto = (max: number) =>
  z
    .string()
    .max(max, "El texto es demasiado largo")
    .transform((s) => s.replace(/[ \t]+/g, " ").trim())

const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** "" o AAAA-MM-DD → null o el mismo texto. */
const fechaOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || FECHA.test(v), { message: "Fecha inválida" })
  .transform((v) => (v === "" ? null : v))

export const oficioSchema = z.object({
  numeroOficio: texto(120),
  numeroRecepcion: texto(60),
  fechaDocumento: fechaOpcional,
  fechaRecepcion: z.string().trim().regex(FECHA, "Indica la fecha de recepción"),
  remitente: texto(200),
  cargoRemitente: texto(200),
  dependencia: texto(250),
  dirigidoA: texto(200),
  tipo: z.enum(valores(TIPOS_OFICIO)),
  asunto: texto(250),
  resumen: texto(2000),
  areaResponsable: z.enum(valores(AREAS_OFICIO)),
  prioridad: z.enum(valores(PRIORIDADES_OFICIO)),
  requiereRespuesta: z.boolean(),
  fechaLimite: fechaOpcional,
  respuestaNumero: texto(120),
  respuestaFecha: fechaOpcional,
})

export type OficioInput = z.input<typeof oficioSchema>

/** Lo mínimo para dar un oficio por revisado. */
export function faltantesParaConfirmar(d: z.output<typeof oficioSchema>): string[] {
  const f: string[] = []
  if (d.asunto.length < 3) f.push("el asunto")
  if (!d.remitente && !d.dependencia) f.push("el remitente o la dependencia")
  return f
}
