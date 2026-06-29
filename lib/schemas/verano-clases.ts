import { z } from "zod"

const hora = z.string().regex(/^\d{2}:\d{2}$/, "Hora en formato HH:mm")

export const personalVeranoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.enum(["maestro", "staff"]),
  rol: z.string().trim().default(""),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{10}$/.test(v), "El teléfono debe tener 10 dígitos")
    .default(""),
})
export type PersonalVeranoInput = z.infer<typeof personalVeranoSchema>

export const claseVeranoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la clase es obligatorio"),
  descripcion: z.string().trim().default(""),
  maestroId: z.number().int().nullable().default(null),
})
export type ClaseVeranoInput = z.infer<typeof claseVeranoSchema>

export const horarioVeranoSchema = z
  .object({
    grupo: z.string().trim().min(1, "Selecciona el equipo"),
    dia: z.string().trim().min(1, "Selecciona el día"),
    horaInicio: hora,
    horaFin: hora,
    claseId: z.number().int({ message: "Selecciona la clase" }),
  })
  .refine((d) => d.horaFin > d.horaInicio, {
    message: "La hora de fin debe ser mayor a la de inicio",
    path: ["horaFin"],
  })
export type HorarioVeranoInput = z.infer<typeof horarioVeranoSchema>
