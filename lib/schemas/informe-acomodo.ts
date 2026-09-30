import { z } from "zod"

// Validación del editor del acomodo (panel interno). Los ids de bloque se
// validan además en el servidor contra la tabla informe_bloques.

const texto = (max: number) =>
  z
    .string()
    .max(max, "El texto es demasiado largo")
    .transform((s) => s.replace(/\s+/g, " ").trim())

export const invitadoAcomodoSchema = z
  .object({
    nombre: texto(150).pipe(z.string().min(3, "Escribe el nombre completo")),
    titulo: texto(30),
    cargo: texto(250),
    grupo: texto(120).pipe(z.string().min(2, "Indica el grupo")),
    bloques: z.array(z.string()),
    asistencia: z.enum(["confirmado", "no_asiste", "sin_confirmar"]),
    nota: texto(400),
    tejedora: z.boolean(),
  })
  .refine((d) => d.tejedora || d.bloques.length > 0, {
    message: "Asigna al menos un bloque, «Por revisar», o márcalo como tejedora",
    path: ["bloques"],
  })

export type InvitadoAcomodoInput = z.input<typeof invitadoAcomodoSchema>

export const moverGrupoSchema = z.object({
  grupo: z.string().trim().min(1, "Elige un grupo"),
  bloques: z.array(z.string()).min(1, "Elige al menos un bloque"),
  /** Si se agrega el grupo a la descripción de los bloques destino. */
  anotarEnBloques: z.boolean(),
})

export type MoverGrupoInput = z.input<typeof moverGrupoSchema>
