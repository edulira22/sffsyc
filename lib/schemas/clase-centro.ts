import { z } from "zod"

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

const horarioSchema = z
  .object({
    diaSemana: z.enum([
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ]),
    horaInicio: z.string().regex(HHMM, "Hora inválida"),
    horaFin: z.string().regex(HHMM, "Hora inválida"),
  })
  .refine((h) => h.horaFin > h.horaInicio, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["horaFin"],
  })

export const asignarClaseSchema = z.object({
  claseId: z
    .number({ message: "Selecciona una clase" })
    .int()
    .positive("Selecciona una clase"),
  profesorId: z.number().int().positive().nullable().optional(),
  nivelGrupo: z.string().trim().optional().or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
  horarios: z
    .array(horarioSchema)
    .min(1, "Agrega al menos un bloque de horario"),
})

export type AsignarClaseInput = z.infer<typeof asignarClaseSchema>

export const DIA_SEMANA_LABEL: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
}

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const
