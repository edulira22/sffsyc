import { z } from "zod"

import {
  DIAS_SEMANA,
  GRADOS_ESCOLARES,
  PARENTESCOS,
  TIPOS_ESCUELA,
  curpValida,
  horaValida,
  limpiarCurp,
  minutosEntre,
} from "@/lib/stem/catalogos"

const texto = (max: number) =>
  z
    .string()
    .max(max, "El texto es demasiado largo")
    .transform((s) => s.replace(/\s+/g, " ").trim())

const requerido = (max: number, mensaje: string) => texto(max).refine((s) => s.length > 0, mensaje)

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const telefono = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .refine((s) => s.length === 0 || s.length === 10, "El teléfono debe tener 10 dígitos")

const deLista = (lista: { valor: string }[], mensaje: string) =>
  z.string().refine((v) => lista.some((o) => o.valor === v), mensaje)

const opcionalDeLista = (lista: { valor: string }[]) =>
  z.string().refine((v) => v === "" || lista.some((o) => o.valor === v), "Opción inválida")

// --- Clase -------------------------------------------------------------------------

/** "" o vacío → null; si no, edad entre 3 y 99. */
const edadOpcional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number({ message: "Edad inválida" }).int().min(3, "Mínimo 3 años").max(99, "Máximo 99 años").nullable()
)

export const claseSchema = z
  .object({
    nombre: requerido(80, "Escribe el nombre de la clase"),
    resumen: texto(600),
    edadMinima: edadOpcional,
    edadMaxima: edadOpcional,
  })
  .refine((d) => d.edadMinima == null || d.edadMaxima == null || d.edadMinima <= d.edadMaxima, {
    message: "La edad mínima no puede ser mayor que la máxima",
    path: ["edadMaxima"],
  })
export type ClaseInput = z.input<typeof claseSchema>

// --- Profesor ----------------------------------------------------------------------

const camposProfesor = {
  nombre: requerido(120, "Escribe el nombre del profesor"),
  email: z.string().trim().toLowerCase().email("Correo no válido"),
  telefono,
  notas: texto(500),
  clases: z.array(z.number().int()).min(1, "Marca al menos una clase que pueda impartir"),
}
export const profesorSchema = z.object(camposProfesor)
export const crearProfesorSchema = z.object({
  ...camposProfesor,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})
export type ProfesorInput = z.input<typeof crearProfesorSchema>

// --- Curso -------------------------------------------------------------------------

export const cursoSchema = z
  .object({
    claseId: z.coerce.number().int().positive("Elige la clase"),
    profesorId: z.coerce.number().int().positive("Elige al profesor"),
    fechaInicio: z.string().regex(FECHA, "Indica la fecha de inicio"),
    fechaFin: z.string().regex(FECHA, "Indica la fecha de fin"),
    dias: z
      .array(z.string())
      .min(1, "Marca al menos un día de clase")
      .refine((ds) => ds.every((d) => DIAS_SEMANA.some((x) => x.valor === d)), "Día inválido"),
    horaInicio: z.string().refine(horaValida, "Hora de inicio inválida"),
    horaFin: z.string().refine(horaValida, "Hora de fin inválida"),
    cupo: z.coerce.number().int().min(1, "El cupo debe ser al menos 1").max(100, "El cupo máximo es 100"),
    notas: texto(500),
  })
  .refine((d) => d.fechaFin >= d.fechaInicio, { message: "El fin no puede ser antes del inicio", path: ["fechaFin"] })
  .refine((d) => minutosEntre(d.horaInicio, d.horaFin) >= 15, {
    message: "La clase debe terminar después de empezar",
    path: ["horaFin"],
  })
export type CursoInput = z.input<typeof cursoSchema>

// --- Alumno ------------------------------------------------------------------------

export const alumnoSchema = z.object({
  curp: z
    .string()
    .transform(limpiarCurp)
    .refine(curpValida, "La CURP no es válida (18 caracteres, revisa letras y números)"),
  nombres: requerido(80, "Escribe el nombre"),
  apellidoPaterno: requerido(60, "Escribe el primer apellido"),
  apellidoMaterno: texto(60),
  escuela: texto(150),
  tipoEscuela: opcionalDeLista(TIPOS_ESCUELA),
  gradoEscolar: deLista(GRADOS_ESCOLARES, "Elige el grado escolar"),
  tutorNombre: requerido(120, "Escribe el nombre de la madre, padre o tutor"),
  tutorParentesco: deLista(PARENTESCOS, "Elige el parentesco"),
  tutorTelefono: telefono.refine((s) => s.length === 10, "El teléfono del tutor debe tener 10 dígitos"),
  telefonoAlterno: telefono,
  tutorCorreo: z.string().trim().toLowerCase().refine((s) => s === "" || z.string().email().safeParse(s).success, "Correo no válido"),
  salud: texto(500),
  observaciones: texto(500),
})
export type AlumnoInput = z.input<typeof alumnoSchema>
