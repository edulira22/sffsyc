import { prisma } from "@/lib/prisma"
import {
  RANGOS_EDAD,
  aISO,
  edadEn,
  estadoCurso,
  fechasDeClase,
  folioAlumno,
  porcentajeAsistencia,
  textoHorario,
  type EstadoCurso,
} from "@/lib/stem/catalogos"

// Consultas de solo lectura del Centro STEM. Las fechas DATE se devuelven como
// AAAA-MM-DD para no desfasarlas por zona horaria en el cliente.

const nombreAlumno = (a: { nombres: string; apellidoPaterno: string; apellidoMaterno: string }) =>
  [a.nombres, a.apellidoPaterno, a.apellidoMaterno].filter(Boolean).join(" ")

// --- Clases y profesores -------------------------------------------------------------

export async function listarClases() {
  const clases = await prisma.stemClase.findMany({
    orderBy: [{ estatus: "asc" }, { nombre: "asc" }],
    include: {
      profesores: { where: { profesor: { estatus: "activo" } }, select: { profesor: { select: { nombre: true } } } },
      _count: { select: { cursos: true } },
    },
  })
  return clases.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    resumen: c.resumen,
    edadMinima: c.edadMinima,
    edadMaxima: c.edadMaxima,
    estatus: c.estatus,
    profesores: c.profesores.map((p) => p.profesor.nombre),
    cursos: c._count.cursos,
  }))
}
export type ClaseListada = Awaited<ReturnType<typeof listarClases>>[number]

export async function listarProfesores(hoy: string) {
  const ps = await prisma.stemProfesor.findMany({
    orderBy: [{ estatus: "asc" }, { nombre: "asc" }],
    include: {
      usuario: { select: { email: true, estatus: true } },
      clases: { select: { claseId: true, clase: { select: { nombre: true } } } },
      cursos: { select: { estatus: true, fechaInicio: true, fechaFin: true } },
    },
  })
  return ps.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: p.usuario.email,
    telefono: p.telefono,
    notas: p.notas,
    estatus: p.estatus,
    clases: p.clases.map((c) => ({ id: c.claseId, nombre: c.clase.nombre })),
    cursosActivos: p.cursos.filter((c) => {
      const e = estadoCurso({ estatus: c.estatus, inicio: aISO(c.fechaInicio)!, fin: aISO(c.fechaFin)! }, hoy)
      return e === "en_curso" || e === "por_iniciar"
    }).length,
  }))
}
export type ProfesorListado = Awaited<ReturnType<typeof listarProfesores>>[number]

/** Clases activas y profesores activos (con las clases que pueden dar) para abrir un curso. */
export async function opcionesCurso() {
  const [clases, profesores] = await Promise.all([
    prisma.stemClase.findMany({ where: { estatus: "activa" }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, edadMinima: true, edadMaxima: true } }),
    prisma.stemProfesor.findMany({
      where: { estatus: "activo" },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, clases: { select: { claseId: true } } },
    }),
  ])
  return { clases, profesores: profesores.map((p) => ({ id: p.id, nombre: p.nombre, clases: p.clases.map((c) => c.claseId) })) }
}
export type OpcionesCurso = Awaited<ReturnType<typeof opcionesCurso>>

// --- Cursos ---------------------------------------------------------------------------

function resumenCurso(
  c: {
    id: number
    estatus: string
    fechaInicio: Date
    fechaFin: Date
    dias: string[]
    horaInicio: string
    horaFin: string
    cupo: number
    clase: { id: number; nombre: string }
    profesor: { id: number; nombre: string }
  },
  inscritos: number,
  hoy: string
) {
  const inicio = aISO(c.fechaInicio)!
  const fin = aISO(c.fechaFin)!
  const fechas = fechasDeClase(inicio, fin, c.dias)
  return {
    id: c.id,
    claseId: c.clase.id,
    clase: c.clase.nombre,
    profesorId: c.profesor.id,
    profesor: c.profesor.nombre,
    inicio,
    fin,
    dias: c.dias,
    horaInicio: c.horaInicio,
    horaFin: c.horaFin,
    horario: textoHorario(c.dias, c.horaInicio, c.horaFin),
    cupo: c.cupo,
    inscritos,
    estado: estadoCurso({ estatus: c.estatus, inicio, fin }, hoy) as EstadoCurso,
    totalClases: fechas.length,
    clasesDadas: fechas.filter((f) => f <= hoy).length,
  }
}

const SELECT_CURSO = {
  id: true,
  estatus: true,
  fechaInicio: true,
  fechaFin: true,
  dias: true,
  horaInicio: true,
  horaFin: true,
  cupo: true,
  clase: { select: { id: true, nombre: true } },
  profesor: { select: { id: true, nombre: true } },
  _count: { select: { inscripciones: { where: { estatus: "activa" } } } },
} as const

export async function listarCursos(hoy: string, profesorId?: number) {
  const cs = await prisma.stemCurso.findMany({
    where: profesorId ? { profesorId } : {},
    orderBy: { fechaInicio: "desc" },
    select: SELECT_CURSO,
  })
  return cs.map((c) => resumenCurso(c, c._count.inscripciones, hoy))
}
export type CursoListado = Awaited<ReturnType<typeof listarCursos>>[number]

/** Cursos donde todavía se puede inscribir (no cancelados ni concluidos). */
export async function cursosAbiertos(hoy: string) {
  return (await listarCursos(hoy)).filter((c) => c.estado === "en_curso" || c.estado === "por_iniciar")
}

/** Curso completo: alumnos (con toda su información), sesiones y asistencia. */
export async function obtenerCurso(id: number, hoy: string) {
  const c = await prisma.stemCurso.findUnique({
    where: { id },
    select: {
      ...SELECT_CURSO,
      notas: true,
      motivoCancelacion: true,
      clase: { select: { id: true, nombre: true, resumen: true, edadMinima: true, edadMaxima: true } },
      inscripciones: {
        orderBy: [{ estatus: "asc" }, { alumno: { apellidoPaterno: "asc" } }],
        select: { id: true, estatus: true, motivoBaja: true, fechaInscripcion: true, alumno: true },
      },
      sesiones: {
        orderBy: { fecha: "asc" },
        select: { id: true, fecha: true, tema: true, registradaPor: true, asistencias: { select: { alumnoId: true, estado: true } } },
      },
    },
  })
  if (!c) return null
  const activos = c.inscripciones.filter((i) => i.estatus === "activa")
  const base = resumenCurso(c, activos.length, hoy)

  const sesiones = c.sesiones.map((s) => ({
    id: s.id,
    fecha: aISO(s.fecha)!,
    tema: s.tema,
    registradaPor: s.registradaPor,
    marcas: Object.fromEntries(s.asistencias.map((a) => [a.alumnoId, a.estado])) as Record<number, string>,
  }))

  const alumnos = c.inscripciones.map((i) => {
    const a = i.alumno
    const marcas = sesiones.map((s) => s.marcas[a.id]).filter(Boolean)
    const asistio = marcas.filter((m) => m === "asistio").length
    const falta = marcas.filter((m) => m === "falta").length
    const justificada = marcas.filter((m) => m === "justificada").length
    const nacimiento = aISO(a.fechaNacimiento)!
    return {
      inscripcionId: i.id,
      estatus: i.estatus,
      motivoBaja: i.motivoBaja,
      fechaInscripcion: aISO(i.fechaInscripcion)!,
      id: a.id,
      folio: folioAlumno(a.id),
      nombre: nombreAlumno(a),
      curp: a.curp,
      nacimiento,
      edad: edadEn(nacimiento, hoy),
      sexo: a.sexo,
      escuela: a.escuela,
      gradoEscolar: a.gradoEscolar,
      tutorNombre: a.tutorNombre,
      tutorParentesco: a.tutorParentesco,
      tutorTelefono: a.tutorTelefono,
      telefonoAlterno: a.telefonoAlterno,
      tutorCorreo: a.tutorCorreo,
      salud: a.salud,
      asistio,
      falta,
      justificada,
      porcentaje: porcentajeAsistencia(asistio, falta, justificada),
    }
  })

  return {
    ...base,
    notas: c.notas,
    motivoCancelacion: c.motivoCancelacion,
    claseResumen: c.clase.resumen,
    edadMinima: c.clase.edadMinima,
    edadMaxima: c.clase.edadMaxima,
    fechasClase: fechasDeClase(base.inicio, base.fin, base.dias),
    sesiones,
    alumnos,
  }
}
export type CursoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerCurso>>>

// --- Alumnos ----------------------------------------------------------------------------

export async function listarAlumnos(hoy: string) {
  const as = await prisma.stemAlumno.findMany({
    where: { estatus: "activo" },
    orderBy: [{ apellidoPaterno: "asc" }, { nombres: "asc" }],
    select: {
      id: true,
      curp: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      fechaNacimiento: true,
      sexo: true,
      gradoEscolar: true,
      tutorNombre: true,
      tutorTelefono: true,
      createdAt: true,
      inscripciones: {
        select: { estatus: true, curso: { select: { estatus: true, fechaInicio: true, fechaFin: true, clase: { select: { nombre: true } } } } },
      },
    },
  })
  return as.map((a) => {
    const nacimiento = aISO(a.fechaNacimiento)!
    const cursos = a.inscripciones.map((i) => ({
      clase: i.curso.clase.nombre,
      activa: i.estatus === "activa",
      estado: estadoCurso({ estatus: i.curso.estatus, inicio: aISO(i.curso.fechaInicio)!, fin: aISO(i.curso.fechaFin)! }, hoy),
    }))
    return {
      id: a.id,
      folio: folioAlumno(a.id),
      nombre: nombreAlumno(a),
      curp: a.curp,
      edad: edadEn(nacimiento, hoy),
      sexo: a.sexo,
      gradoEscolar: a.gradoEscolar,
      tutorNombre: a.tutorNombre,
      tutorTelefono: a.tutorTelefono,
      registrado: aISO(a.createdAt)!,
      totalCursos: cursos.length,
      cursoActual: cursos.find((c) => c.activa && (c.estado === "en_curso" || c.estado === "por_iniciar"))?.clase ?? null,
    }
  })
}
export type AlumnoListado = Awaited<ReturnType<typeof listarAlumnos>>[number]

export async function obtenerAlumno(id: number, hoy: string) {
  const a = await prisma.stemAlumno.findUnique({
    where: { id },
    include: {
      inscripciones: {
        orderBy: { fechaInscripcion: "desc" },
        include: {
          curso: { select: SELECT_CURSO },
        },
      },
      asistencias: { select: { estado: true, sesion: { select: { cursoId: true } } } },
    },
  })
  if (!a || a.estatus !== "activo") return null
  const nacimiento = aISO(a.fechaNacimiento)!
  return {
    id: a.id,
    folio: folioAlumno(a.id),
    nombre: nombreAlumno(a),
    nacimiento,
    edad: edadEn(nacimiento, hoy),
    formulario: {
      curp: a.curp,
      nombres: a.nombres,
      apellidoPaterno: a.apellidoPaterno,
      apellidoMaterno: a.apellidoMaterno,
      escuela: a.escuela,
      tipoEscuela: a.tipoEscuela,
      gradoEscolar: a.gradoEscolar,
      tutorNombre: a.tutorNombre,
      tutorParentesco: a.tutorParentesco,
      tutorTelefono: a.tutorTelefono,
      telefonoAlterno: a.telefonoAlterno,
      tutorCorreo: a.tutorCorreo,
      salud: a.salud,
      observaciones: a.observaciones,
    },
    sexo: a.sexo,
    registrado: aISO(a.createdAt)!,
    historial: a.inscripciones.map((i) => {
      const marcas = a.asistencias.filter((x) => x.sesion.cursoId === i.cursoId).map((x) => x.estado)
      const asistio = marcas.filter((m) => m === "asistio").length
      const falta = marcas.filter((m) => m === "falta").length
      const justificada = marcas.filter((m) => m === "justificada").length
      return {
        inscripcionId: i.id,
        estatus: i.estatus,
        motivoBaja: i.motivoBaja,
        fechaInscripcion: aISO(i.fechaInscripcion)!,
        curso: resumenCurso(i.curso, i.curso._count.inscripciones, hoy),
        porcentaje: porcentajeAsistencia(asistio, falta, justificada),
        sesiones: marcas.length,
      }
    }),
  }
}
export type AlumnoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerAlumno>>>

/** Lista corta para buscar e inscribir a un alumno ya registrado. */
export async function alumnosParaBuscar(hoy: string) {
  const as = await prisma.stemAlumno.findMany({
    where: { estatus: "activo" },
    orderBy: [{ apellidoPaterno: "asc" }, { nombres: "asc" }],
    select: { id: true, curp: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, fechaNacimiento: true },
  })
  return as.map((a) => ({ id: a.id, folio: folioAlumno(a.id), nombre: nombreAlumno(a), curp: a.curp, edad: edadEn(aISO(a.fechaNacimiento)!, hoy) }))
}
export type AlumnoBuscable = Awaited<ReturnType<typeof alumnosParaBuscar>>[number]

// --- Panel --------------------------------------------------------------------------------

export async function panelStem(hoy: string) {
  const [cursos, alumnos, inscripciones, asistencias] = await Promise.all([
    listarCursos(hoy),
    prisma.stemAlumno.findMany({ where: { estatus: "activo" }, select: { id: true, sexo: true, fechaNacimiento: true } }),
    prisma.stemInscripcion.findMany({
      select: { alumnoId: true, cursoId: true, estatus: true, curso: { select: { clase: { select: { nombre: true } } } } },
    }),
    prisma.stemAsistencia.groupBy({ by: ["estado"], _count: true }),
  ])

  // Reinscritos: alumnos que han estado en más de un curso (aunque ya terminó).
  const porAlumno = new Map<number, Set<number>>()
  for (const i of inscripciones) porAlumno.set(i.alumnoId, (porAlumno.get(i.alumnoId) ?? new Set()).add(i.cursoId))

  const activas = inscripciones.filter((i) => i.estatus === "activa")
  const porClase = new Map<string, number>()
  for (const i of activas) porClase.set(i.curso.clase.nombre, (porClase.get(i.curso.clase.nombre) ?? 0) + 1)

  const edades = alumnos.map((a) => edadEn(aISO(a.fechaNacimiento)!, hoy))
  const cuenta = (estado: string) => asistencias.find((x) => x.estado === estado)?._count ?? 0

  return {
    alumnos: alumnos.length,
    cursosEnCurso: cursos.filter((c) => c.estado === "en_curso").length,
    cursosPorIniciar: cursos.filter((c) => c.estado === "por_iniciar").length,
    inscripciones: activas.length,
    reinscritos: Array.from(porAlumno.values()).filter((cursos) => cursos.size > 1).length,
    asistenciaGeneral: porcentajeAsistencia(cuenta("asistio"), cuenta("falta"), cuenta("justificada")),
    porClase: Array.from(porClase.entries()).map(([clase, n]) => ({ clase, n })).sort((a, b) => b.n - a.n),
    porSexo: [
      { label: "Mujeres", n: alumnos.filter((a) => a.sexo === "M").length },
      { label: "Hombres", n: alumnos.filter((a) => a.sexo === "H").length },
      { label: "No binario", n: alumnos.filter((a) => a.sexo === "X").length },
    ].filter((x) => x.n > 0),
    porEdad: RANGOS_EDAD.map((r) => ({ label: r.label, n: edades.filter((e) => e >= r.min && e <= r.max).length })),
    cursosActivos: cursos.filter((c) => c.estado === "en_curso" || c.estado === "por_iniciar"),
  }
}
export type PanelStem = Awaited<ReturnType<typeof panelStem>>
