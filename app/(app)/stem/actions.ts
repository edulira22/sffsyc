"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { exito, fallo, type ResultadoAccion } from "@/lib/acciones"
import { puedeVerCurso, quienStem } from "@/lib/stem/acceso"
import {
  ESTADOS_ASISTENCIA,
  aISO,
  datosDeCurp,
  edadEn,
  estadoCurso,
  fechasDeClase,
  folioAlumno,
  hoyChihuahua,
  seEmpalman,
  textoHorario,
} from "@/lib/stem/catalogos"
import {
  alumnoSchema,
  claseSchema,
  crearProfesorSchema,
  cursoSchema,
  profesorSchema,
  type AlumnoInput,
  type ClaseInput,
  type CursoInput,
  type ProfesorInput,
} from "@/lib/schemas/stem"

// Acciones del Centro STEM. Cada una vuelve a revisar quién la pide:
// administración del STEM para casi todo; el profesor solo para tomar
// asistencia en sus propios cursos.

const refrescar = () => revalidatePath("/stem", "layout")
const primerError = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Revisa los datos."
const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`)

async function soloAdmin() {
  const q = await quienStem()
  return q.esAdmin ? q : null
}

// --- Clases --------------------------------------------------------------------------

export async function guardarClase(id: number | null, input: ClaseInput): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const p = claseSchema.safeParse(input)
  if (!p.success) return fallo(primerError(p.error))
  const d = p.data
  const repetida = await prisma.stemClase.findFirst({
    where: { nombre: { equals: d.nombre, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  })
  if (repetida) return fallo(`Ya existe una clase llamada "${d.nombre}".`)
  const data = { nombre: d.nombre, resumen: d.resumen, edadMinima: d.edadMinima, edadMaxima: d.edadMaxima }
  if (id) await prisma.stemClase.update({ where: { id }, data })
  else await prisma.stemClase.create({ data })
  refrescar()
  return exito(id ? "Clase actualizada." : "Clase creada.")
}

export async function cambiarEstatusClase(id: number, estatus: "activa" | "inactiva"): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  await prisma.stemClase.update({ where: { id }, data: { estatus } })
  refrescar()
  return exito(estatus === "activa" ? "Clase reactivada." : "Clase desactivada: ya no se ofrece al abrir cursos.")
}

// --- Profesores ------------------------------------------------------------------------

export async function crearProfesor(input: ProfesorInput): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const p = crearProfesorSchema.safeParse(input)
  if (!p.success) return fallo(primerError(p.error))
  const d = p.data
  try {
    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarioSistema.create({
        data: {
          nombre: d.nombre,
          email: d.email,
          passwordHash: await bcrypt.hash(d.password, 12),
          // Rol propio: el middleware lo limita a "Mis cursos".
          rol: "profesor_stem",
          areasPermitidas: ["centro-stem"],
        },
      })
      await tx.stemProfesor.create({
        data: {
          usuarioId: usuario.id,
          nombre: d.nombre,
          telefono: d.telefono,
          notas: d.notas,
          clases: { create: d.clases.map((claseId) => ({ claseId })) },
        },
      })
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fallo("Ya existe un usuario con ese correo.")
    }
    throw e
  }
  refrescar()
  revalidatePath("/admin/usuarios")
  return exito(`Profesor creado. Ya puede entrar con ${d.email}.`)
}

export async function editarProfesor(id: number, input: Omit<ProfesorInput, "password">): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const p = profesorSchema.safeParse(input)
  if (!p.success) return fallo(primerError(p.error))
  const d = p.data
  const prof = await prisma.stemProfesor.findUnique({ where: { id }, select: { usuarioId: true } })
  if (!prof) return fallo("No se encontró al profesor.")
  try {
    await prisma.$transaction([
      prisma.usuarioSistema.update({ where: { id: prof.usuarioId }, data: { nombre: d.nombre, email: d.email } }),
      prisma.stemProfesor.update({ where: { id }, data: { nombre: d.nombre, telefono: d.telefono, notas: d.notas } }),
      prisma.stemProfesorClase.deleteMany({ where: { profesorId: id } }),
      prisma.stemProfesorClase.createMany({ data: d.clases.map((claseId) => ({ profesorId: id, claseId })) }),
    ])
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fallo("Ya existe un usuario con ese correo.")
    }
    throw e
  }
  refrescar()
  return exito("Profesor actualizado.")
}

export async function cambiarEstatusProfesor(id: number, estatus: "activo" | "inactivo"): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const prof = await prisma.stemProfesor.findUnique({
    where: { id },
    select: { usuarioId: true, cursos: { select: { estatus: true, fechaInicio: true, fechaFin: true } } },
  })
  if (!prof) return fallo("No se encontró al profesor.")
  if (estatus === "inactivo") {
    const hoy = hoyChihuahua()
    const vigentes = prof.cursos.filter((c) => {
      const e = estadoCurso({ estatus: c.estatus, inicio: aISO(c.fechaInicio)!, fin: aISO(c.fechaFin)! }, hoy)
      return e === "en_curso" || e === "por_iniciar"
    }).length
    if (vigentes > 0) {
      return fallo(`Tiene ${vigentes} ${vigentes === 1 ? "curso vigente" : "cursos vigentes"}. Asígnalos a otro profesor antes de darlo de baja.`)
    }
  }
  // Sin acceso a la plataforma mientras esté inactivo.
  await prisma.$transaction([
    prisma.stemProfesor.update({ where: { id }, data: { estatus } }),
    prisma.usuarioSistema.update({ where: { id: prof.usuarioId }, data: { estatus } }),
  ])
  refrescar()
  return exito(estatus === "activo" ? "Profesor reactivado." : "Profesor dado de baja; ya no puede entrar.")
}

export async function cambiarPasswordProfesor(id: number, password: string): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  if (password.length < 8) return fallo("La contraseña debe tener al menos 8 caracteres.")
  const prof = await prisma.stemProfesor.findUnique({ where: { id }, select: { usuarioId: true } })
  if (!prof) return fallo("No se encontró al profesor.")
  await prisma.usuarioSistema.update({ where: { id: prof.usuarioId }, data: { passwordHash: await bcrypt.hash(password, 12) } })
  return exito("Contraseña actualizada.")
}

// --- Cursos ------------------------------------------------------------------------------

export async function guardarCurso(
  id: number | null,
  input: CursoInput
): Promise<{ ok: true; id: number; mensaje: string } | { ok: false; error: string }> {
  if (!(await soloAdmin())) return { ok: false, error: "No tienes acceso a la administración del Centro STEM." }
  const p = cursoSchema.safeParse(input)
  if (!p.success) return { ok: false, error: primerError(p.error) }
  const d = p.data

  const [clase, profesor] = await Promise.all([
    prisma.stemClase.findUnique({ where: { id: d.claseId }, select: { estatus: true, nombre: true } }),
    prisma.stemProfesor.findUnique({
      where: { id: d.profesorId },
      select: { nombre: true, estatus: true, clases: { select: { claseId: true } } },
    }),
  ])
  if (!clase || (clase.estatus !== "activa" && !id)) return { ok: false, error: "La clase no existe o está desactivada." }
  if (!profesor || profesor.estatus !== "activo") return { ok: false, error: "El profesor no existe o está dado de baja." }
  if (!profesor.clases.some((c) => c.claseId === d.claseId)) {
    return { ok: false, error: `${profesor.nombre} no tiene registrada la clase ${clase.nombre}. Agrégala en su perfil o elige a otro profesor.` }
  }
  if (fechasDeClase(d.fechaInicio, d.fechaFin, d.dias).length === 0) {
    return { ok: false, error: "Con esas fechas y días no habría ninguna clase. Revisa el periodo." }
  }

  // Un profesor no puede estar en dos cursos a la misma hora.
  const otros = await prisma.stemCurso.findMany({
    where: { profesorId: d.profesorId, estatus: "activo", ...(id ? { NOT: { id } } : {}) },
    select: { fechaInicio: true, fechaFin: true, dias: true, horaInicio: true, horaFin: true, clase: { select: { nombre: true } } },
  })
  const nuevo = { inicio: d.fechaInicio, fin: d.fechaFin, dias: d.dias, horaInicio: d.horaInicio, horaFin: d.horaFin }
  const choque = otros.find((o) =>
    seEmpalman(nuevo, { inicio: aISO(o.fechaInicio)!, fin: aISO(o.fechaFin)!, dias: o.dias, horaInicio: o.horaInicio, horaFin: o.horaFin })
  )
  if (choque) {
    return {
      ok: false,
      error: `${profesor.nombre} ya tiene ${choque.clase.nombre} (${textoHorario(choque.dias, choque.horaInicio, choque.horaFin)}) en esas fechas.`,
    }
  }

  if (id) {
    const inscritos = await prisma.stemInscripcion.count({ where: { cursoId: id, estatus: "activa" } })
    if (d.cupo < inscritos) return { ok: false, error: `Ya hay ${inscritos} alumnos inscritos; el cupo no puede ser menor.` }
  }

  const data = {
    claseId: d.claseId,
    profesorId: d.profesorId,
    fechaInicio: aFecha(d.fechaInicio),
    fechaFin: aFecha(d.fechaFin),
    dias: d.dias,
    horaInicio: d.horaInicio,
    horaFin: d.horaFin,
    cupo: d.cupo,
    notas: d.notas,
  }
  const curso = id ? await prisma.stemCurso.update({ where: { id }, data }) : await prisma.stemCurso.create({ data })
  refrescar()
  return { ok: true, id: curso.id, mensaje: id ? "Curso actualizado." : "Curso abierto." }
}

export async function cancelarCurso(id: number, motivo: string): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const limpio = motivo.replace(/\s+/g, " ").trim().slice(0, 300)
  if (limpio.length < 3) return fallo("Indica el motivo de la cancelación.")
  await prisma.stemCurso.update({ where: { id }, data: { estatus: "cancelado", motivoCancelacion: limpio } })
  refrescar()
  return exito("Curso cancelado. Sus alumnos y su asistencia se conservan.")
}

// --- Alumnos e inscripciones -----------------------------------------------------------------

type ResultadoAlumno =
  | { ok: true; id: number; mensaje: string }
  | { ok: false; error: string; existenteId?: number }

/**
 * Registra o actualiza a un alumno. La CURP es su identificador único: si ya
 * existe, no se duplica (se devuelve su id para reutilizarlo e inscribirlo).
 */
export async function guardarAlumno(id: number | null, input: AlumnoInput, cursoId?: number | null): Promise<ResultadoAlumno> {
  const q = await soloAdmin()
  if (!q) return { ok: false, error: "No tienes acceso a la administración del Centro STEM." }
  const p = alumnoSchema.safeParse(input)
  if (!p.success) return { ok: false, error: primerError(p.error) }
  const d = p.data
  const deCurp = datosDeCurp(d.curp)
  if (!deCurp) return { ok: false, error: "La fecha de nacimiento de la CURP no es válida." }

  const existente = await prisma.stemAlumno.findUnique({ where: { curp: d.curp }, select: { id: true, nombres: true, apellidoPaterno: true } })
  if (existente && existente.id !== id) {
    return {
      ok: false,
      existenteId: existente.id,
      error: `Esa CURP ya está registrada: ${existente.nombres} ${existente.apellidoPaterno} (${folioAlumno(existente.id)}).`,
    }
  }

  const data = { ...d, fechaNacimiento: aFecha(deCurp.fechaNacimiento), sexo: deCurp.sexo }
  const alumno = id
    ? await prisma.stemAlumno.update({ where: { id }, data })
    : await prisma.stemAlumno.create({ data: { ...data, creadoPorId: q.usuarioId } })

  let mensaje = id ? "Datos del alumno actualizados." : `Alumno registrado con el folio ${folioAlumno(alumno.id)}.`
  if (!id && cursoId) {
    const r = await inscribir(cursoId, alumno.id)
    mensaje += r.ok ? ` ${r.mensaje}` : ` No se pudo inscribir: ${r.error}`
  }
  refrescar()
  return { ok: true, id: alumno.id, mensaje }
}

async function inscribir(cursoId: number, alumnoId: number): Promise<{ ok: true; mensaje: string } | { ok: false; error: string }> {
  const hoy = hoyChihuahua()
  const curso = await prisma.stemCurso.findUnique({
    where: { id: cursoId },
    select: {
      estatus: true,
      fechaInicio: true,
      fechaFin: true,
      cupo: true,
      clase: { select: { nombre: true, edadMinima: true, edadMaxima: true } },
      _count: { select: { inscripciones: { where: { estatus: "activa" } } } },
    },
  })
  if (!curso) return { ok: false, error: "No se encontró el curso." }
  const estado = estadoCurso({ estatus: curso.estatus, inicio: aISO(curso.fechaInicio)!, fin: aISO(curso.fechaFin)! }, hoy)
  if (estado === "cancelado") return { ok: false, error: "El curso está cancelado." }
  if (estado === "concluido") return { ok: false, error: "El curso ya concluyó." }

  const previa = await prisma.stemInscripcion.findUnique({ where: { cursoId_alumnoId: { cursoId, alumnoId } }, select: { id: true, estatus: true } })
  if (previa?.estatus === "activa") return { ok: false, error: "Ya está inscrito en este curso." }
  if (curso._count.inscripciones >= curso.cupo) return { ok: false, error: `El curso está lleno (cupo de ${curso.cupo}).` }

  if (previa) {
    await prisma.stemInscripcion.update({ where: { id: previa.id }, data: { estatus: "activa", motivoBaja: "", fechaInscripcion: aFecha(hoy) } })
  } else {
    await prisma.stemInscripcion.create({ data: { cursoId, alumnoId, fechaInscripcion: aFecha(hoy) } })
  }

  // La edad recomendada de la clase es un aviso, no un bloqueo.
  const alumno = await prisma.stemAlumno.findUnique({ where: { id: alumnoId }, select: { fechaNacimiento: true } })
  const edad = alumno ? edadEn(aISO(alumno.fechaNacimiento)!, hoy) : null
  const { edadMinima: min, edadMaxima: max } = curso.clase
  const fuera = edad != null && ((min != null && edad < min) || (max != null && edad > max))
  return {
    ok: true,
    mensaje: `Inscrito en ${curso.clase.nombre}.${fuera ? ` Ojo: tiene ${edad} años y la clase es para ${min ?? "?"}–${max ?? "?"}.` : ""}`,
  }
}

export async function inscribirAlumno(cursoId: number, alumnoId: number): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const r = await inscribir(cursoId, alumnoId)
  if (!r.ok) return fallo(r.error)
  refrescar()
  return exito(r.mensaje)
}

export async function darDeBajaInscripcion(inscripcionId: number, motivo: string): Promise<ResultadoAccion> {
  if (!(await soloAdmin())) return fallo("No tienes acceso a la administración del Centro STEM.")
  const limpio = motivo.replace(/\s+/g, " ").trim().slice(0, 300)
  if (limpio.length < 3) return fallo("Indica el motivo de la baja.")
  await prisma.stemInscripcion.update({ where: { id: inscripcionId }, data: { estatus: "baja", motivoBaja: limpio } })
  refrescar()
  return exito("Baja registrada. Su asistencia anterior se conserva.")
}

// --- Asistencia (administración y el profesor del curso) ---------------------------------------

export async function guardarAsistencia(
  cursoId: number,
  fecha: string,
  tema: string,
  marcas: { alumnoId: number; estado: string }[]
): Promise<ResultadoAccion> {
  const q = await quienStem()
  if (!(await puedeVerCurso(q, cursoId))) return fallo("No tienes acceso a este curso.")

  const hoy = hoyChihuahua()
  const curso = await prisma.stemCurso.findUnique({
    where: { id: cursoId },
    select: {
      estatus: true,
      fechaInicio: true,
      fechaFin: true,
      dias: true,
      inscripciones: { where: { estatus: "activa" }, select: { alumnoId: true } },
    },
  })
  if (!curso) return fallo("No se encontró el curso.")
  if (curso.estatus === "cancelado") return fallo("El curso está cancelado.")
  const fechas = fechasDeClase(aISO(curso.fechaInicio)!, aISO(curso.fechaFin)!, curso.dias)
  if (!fechas.includes(fecha)) return fallo("Ese día no hay clase en este curso.")
  if (fecha > hoy) return fallo("No se puede tomar asistencia de un día que no ha llegado.")

  const inscritos = new Set(curso.inscripciones.map((i) => i.alumnoId))
  const validas = marcas.filter((m) => inscritos.has(m.alumnoId) && ESTADOS_ASISTENCIA.some((e) => e.valor === m.estado))
  if (validas.length === 0) return fallo("Marca la asistencia de al menos un alumno.")
  const temaLimpio = tema.replace(/\s+/g, " ").trim().slice(0, 200)

  await prisma.$transaction(async (tx) => {
    const sesion = await tx.stemSesion.upsert({
      where: { cursoId_fecha: { cursoId, fecha: aFecha(fecha) } },
      create: { cursoId, fecha: aFecha(fecha), tema: temaLimpio, registradaPor: q.nombre },
      update: { tema: temaLimpio, registradaPor: q.nombre },
    })
    for (const m of validas) {
      await tx.stemAsistencia.upsert({
        where: { sesionId_alumnoId: { sesionId: sesion.id, alumnoId: m.alumnoId } },
        create: { sesionId: sesion.id, alumnoId: m.alumnoId, estado: m.estado },
        update: { estado: m.estado },
      })
    }
  })
  refrescar()
  const faltan = inscritos.size - validas.length
  return exito(`Asistencia guardada${faltan > 0 ? `; faltó marcar a ${faltan}` : ""}.`)
}

/** Para avisar mientras se captura: ¿esta CURP ya es de un alumno registrado? */
export async function buscarAlumnoPorCurp(curp: string): Promise<{ id: number; folio: string; nombre: string } | null> {
  if (!(await soloAdmin())) return null
  const limpia = curp.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (limpia.length !== 18) return null
  const a = await prisma.stemAlumno.findUnique({
    where: { curp: limpia },
    select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true },
  })
  return a ? { id: a.id, folio: folioAlumno(a.id), nombre: [a.nombres, a.apellidoPaterno, a.apellidoMaterno].filter(Boolean).join(" ") } : null
}
