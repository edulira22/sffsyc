import { z } from "zod"

import { PREGUNTAS_ENCUESTA } from "@/lib/eventos/encuesta-padres"

// El esquema se construye a partir de la definición de preguntas para que
// formulario, validación y almacenamiento nunca se desincronicen.

const shape: Record<string, z.ZodTypeAny> = {}

for (const p of PREGUNTAS_ENCUESTA) {
  const faltante = `Falta responder la pregunta ${p.numero}`

  switch (p.tipo) {
    case "opcion": {
      const valores = (p.opciones ?? []).map((o) => o.valor)
      shape[p.id] = z
        .string()
        .refine((v) => valores.includes(v), { message: faltante })
      break
    }
    case "estrellas":
      shape[p.id] = z
        .number({ message: faltante })
        .int()
        .min(1, faltante)
        .max(5, faltante)
      break
    case "multiple": {
      const valores = (p.opciones ?? []).map((o) => o.valor)
      shape[p.id] = z
        .array(z.string().refine((v) => valores.includes(v)))
        .min(1, faltante)
      break
    }
    case "texto":
      shape[p.id] = z
        .string()
        .trim()
        .min(3, faltante)
        .max(1500, "La respuesta es demasiado larga")
      break
  }
}

export const encuestaPadresSchema = z.object(shape)

/** Mapa preguntaId → respuesta. El tipo depende del tipo de pregunta. */
export type EncuestaPadresInput = Record<string, string | number | string[]>

/** Valores iniciales vacíos para el formulario. */
export function valoresInicialesEncuesta(): EncuestaPadresInput {
  const v: EncuestaPadresInput = {}
  for (const p of PREGUNTAS_ENCUESTA) {
    if (p.tipo === "multiple") v[p.id] = []
    else if (p.tipo === "estrellas") v[p.id] = 0
    else v[p.id] = ""
  }
  return v
}
