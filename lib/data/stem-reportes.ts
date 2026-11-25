import { prisma } from "@/lib/prisma"
import {
  DIAS_SEMANA,
  ESTADOS_CURSO,
  GRADOS_ESCOLARES,
  PARENTESCOS,
  SEXOS,
  TIPOS_ESCUELA,
  aISO,
  edadEn,
  estadoCurso,
  fechasDeClase,
  folioAlumno,
  label,
  porcentajeAsistencia,
  textoHorario,
} from "@/lib/stem/catalogos"
import { TIPOS_REPORTE, rangoDe, type ParametrosReporte, type Reporte, type ValorCelda } from "@/lib/stem/reportes"

// Reportes del Centro STEM (solo lectura). Un curso entra al periodo si sus
// fechas se cruzan con él; las clases impartidas y la asistencia cuentan solo
// las sesiones con fecha dentro del periodo; las inscripciones, por su fecha.

const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`)
const nombreAlumno = (a: { nombres: string; apellidoPaterno: string; apellidoMaterno: string }) =>
  [a.nombres, a.apellidoPaterno, a.apellidoMaterno].filter(Boolean).join(" ")
const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
const redondear1 = (n: number) => Math.round(n * 10) / 10
const pct = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 100) : null)
const num = (n: number) => n.toLocaleString("es-MX")

type Conteo = { asistio: number; falta: number; justificada: number }
const conteoVacio = (): Conteo => ({ asistio: 0, falta: 0, justificada: 0 })
function sumar(c: Conteo, estado: string) {
  if (estado === "asistio" || estado === "falta" || estado === "justificada") c[estado]++
}
const asistenciaDe = (c: Conteo) => porcentajeAsistencia(c.asistio, c.falta, c.justificada)

export async function generarReporte(p: ParametrosReporte, hoy: string): Promise<Reporte> {
  const { desde, hasta, texto } = rangoDe(p)
  const filtroCurso = { ...(p.clase ? { claseId: p.clase } : {}), ...(p.profesor ? { profesorId: p.profesor } : {}) }

  const [cursosBD, inscripcionesPeriodo, primeras, nombresFiltro] = await Promise.all([
    prisma.stemCurso.findMany({
      where: { ...filtroCurso, fechaInicio: { lte: aFecha(hasta) }, fechaFin: { gte: aFecha(desde) } },
      orderBy: [{ fechaInicio: "asc" }, { id: "asc" }],
      select: {
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
        inscripciones: {
          select: {
            estatus: true,
            alumno: {
              select: {
                id: true,
                curp: true,
                nombres: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                fechaNacimiento: true,
                sexo: true,
                escuela: true,
                tipoEscuela: true,
                gradoEscolar: true,
                tutorNombre: true,
                tutorParentesco: true,
                tutorTelefono: true,
              },
            },
          },
        },
        sesiones: {
          where: { fecha: { gte: aFecha(desde), lte: aFecha(hasta) } },
          orderBy: { fecha: "asc" },
          select: { id: true, fecha: true, tema: true, asistencias: { select: { alumnoId: true, estado: true } } },
        },
      },
    }),
    prisma.stemInscripcion.findMany({
      where: { fechaInscripcion: { gte: aFecha(desde), lte: aFecha(hasta) }, curso: filtroCurso },
      orderBy: [{ fechaInscripcion: "asc" }, { id: "asc" }],
      select: {
        fechaInscripcion: true,
        estatus: true,
        motivoBaja: true,
        alumnoId: true,
        alumno: { select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, curp: true } },
        curso: {
          select: {
            fechaInicio: true,
            fechaFin: true,
            dias: true,
            horaInicio: true,
            horaFin: true,
            clase: { select: { nombre: true } },
            profesor: { select: { nombre: true } },
          },
        },
      },
    }),
    // Primera inscripción de cada alumno (para saber quién es nuevo en el periodo).
    p.tipo === "resumen" ? prisma.stemInscripcion.groupBy({ by: ["alumnoId"], _min: { fechaInscripcion: true } }) : Promise.resolve([]),
    Promise.all([
      p.clase ? prisma.stemClase.findUnique({ where: { id: p.clase }, select: { nombre: true } }) : null,
      p.profesor ? prisma.stemProfesor.findUnique({ where: { id: p.profesor }, select: { nombre: true } }) : null,
    ]),
  ])

  // --- Cálculos por curso ---------------------------------------------------------------
  const cursos = cursosBD.map((c) => {
    const inicio = aISO(c.fechaInicio)!
    const fin = aISO(c.fechaFin)!
    const estado = estadoCurso({ estatus: c.estatus, inicio, fin }, hoy)
    const desdeCurso = inicio > desde ? inicio : desde
    const hastaCurso = fin < hasta ? fin : hasta
    const programadas = c.estatus === "cancelado" ? 0 : fechasDeClase(desdeCurso, hastaCurso, c.dias).length
    const conteo = conteoVacio()
    for (const s of c.sesiones) for (const a of s.asistencias) sumar(conteo, a.estado)
    const activos = c.inscripciones.filter((i) => i.estatus === "activa")
    const duracion = (minutos(c.horaFin) - minutos(c.horaInicio)) / 60
    return {
      ...c,
      inicio,
      fin,
      estado,
      programadas,
      conteo,
      activos: activos.length,
      bajas: c.inscripciones.length - activos.length,
      impartidas: c.sesiones.length,
      horas: c.sesiones.length * duracion,
      duracion,
    }
  })
  const vigentes = cursos.filter((c) => c.estatus !== "cancelado")

  const filtros = [nombresFiltro[0] && `Clase: ${nombresFiltro[0].nombre}`, nombresFiltro[1] && `Profesor: ${nombresFiltro[1].nombre}`]
    .filter(Boolean)
    .join(" · ") || "Todas las clases y profesores"
  const titulo = TIPOS_REPORTE.find((t) => t.valor === p.tipo)!.label
  const base = { titulo, periodo: texto, filtros }

  // Agrupa cursos (por clase o por profesor) con sus totales.
  function agrupar(clave: (c: (typeof cursos)[number]) => { id: number; nombre: string }) {
    const grupos = new Map<number, { nombre: string; cursos: typeof cursos }>()
    for (const c of vigentes) {
      const k = clave(c)
      const g = grupos.get(k.id) ?? { nombre: k.nombre, cursos: [] }
      g.cursos.push(c)
      grupos.set(k.id, g)
    }
    return Array.from(grupos.values())
      .map((g) => {
        const conteo = conteoVacio()
        for (const c of g.cursos) {
          conteo.asistio += c.conteo.asistio
          conteo.falta += c.conteo.falta
          conteo.justificada += c.conteo.justificada
        }
        const alumnos = new Set(g.cursos.flatMap((c) => c.inscripciones.filter((i) => i.estatus === "activa").map((i) => i.alumno.id)))
        const cupo = g.cursos.reduce((s, c) => s + c.cupo, 0)
        const inscritos = g.cursos.reduce((s, c) => s + c.activos, 0)
        return {
          nombre: g.nombre,
          cursos: g.cursos.length,
          impartidas: g.cursos.reduce((s, c) => s + c.impartidas, 0),
          programadas: g.cursos.reduce((s, c) => s + c.programadas, 0),
          horas: redondear1(g.cursos.reduce((s, c) => s + c.horas, 0)),
          alumnos: alumnos.size,
          inscripciones: inscritos,
          ocupacion: pct(inscritos, cupo),
          asistencia: asistenciaDe(conteo),
        }
      })
      .sort((a, b) => b.alumnos - a.alumnos || a.nombre.localeCompare(b.nombre))
  }

  // --- Cada tipo de reporte -------------------------------------------------------------
  if (p.tipo === "cursos") {
    return {
      ...base,
      metricas: [
        { etiqueta: "Cursos", valor: vigentes.length, nota: cursos.length > vigentes.length ? `${cursos.length - vigentes.length} cancelados aparte` : undefined },
        { etiqueta: "Alumnos inscritos", valor: vigentes.reduce((s, c) => s + c.activos, 0) },
        { etiqueta: "Clases impartidas", valor: vigentes.reduce((s, c) => s + c.impartidas, 0) },
        { etiqueta: "Ocupación", valor: `${pct(vigentes.reduce((s, c) => s + c.activos, 0), vigentes.reduce((s, c) => s + c.cupo, 0)) ?? 0}%` },
      ],
      columnas: [
        { clave: "clase", titulo: "Clase", ancho: 24 },
        { clave: "profesor", titulo: "Profesor", ancho: 28 },
        { clave: "horario", titulo: "Días y horario", ancho: 28 },
        { clave: "inicio", titulo: "Inicio", tipo: "fecha" },
        { clave: "fin", titulo: "Fin", tipo: "fecha" },
        { clave: "estado", titulo: "Estado", ancho: 12 },
        { clave: "cupo", titulo: "Cupo", tipo: "numero" },
        { clave: "inscritos", titulo: "Inscritos", tipo: "numero" },
        { clave: "bajas", titulo: "Bajas", tipo: "numero" },
        { clave: "ocupacion", titulo: "Ocupación", tipo: "porcentaje" },
        { clave: "programadas", titulo: "Clases programadas en el periodo", tipo: "numero" },
        { clave: "impartidas", titulo: "Clases impartidas en el periodo", tipo: "numero" },
        { clave: "horas", titulo: "Horas impartidas", tipo: "numero" },
        { clave: "asistencia", titulo: "Asistencia", tipo: "porcentaje" },
      ],
      filas: cursos.map((c) => ({
        clase: c.clase.nombre,
        profesor: c.profesor.nombre,
        horario: textoHorario(c.dias, c.horaInicio, c.horaFin),
        inicio: c.inicio,
        fin: c.fin,
        estado: label(ESTADOS_CURSO, c.estado),
        cupo: c.cupo,
        inscritos: c.activos,
        bajas: c.bajas,
        ocupacion: pct(c.activos, c.cupo),
        programadas: c.programadas,
        impartidas: c.impartidas,
        horas: redondear1(c.horas),
        asistencia: asistenciaDe(c.conteo),
      })),
    }
  }

  if (p.tipo === "alumnos") {
    type Fila = { alumno: (typeof cursos)[number]["inscripciones"][number]["alumno"]; cursos: string[]; conteo: Conteo }
    const porAlumno = new Map<number, Fila>()
    for (const c of cursos) {
      for (const i of c.inscripciones) {
        const f = porAlumno.get(i.alumno.id) ?? { alumno: i.alumno, cursos: [], conteo: conteoVacio() }
        f.cursos.push(`${c.clase.nombre}${i.estatus === "baja" ? " (baja)" : c.estatus === "cancelado" ? " (cancelado)" : ""}`)
        porAlumno.set(i.alumno.id, f)
      }
      for (const s of c.sesiones) for (const a of s.asistencias) {
        const f = porAlumno.get(a.alumnoId)
        if (f) sumar(f.conteo, a.estado)
      }
    }
    const filas = Array.from(porAlumno.values()).sort((a, b) => nombreAlumno(a.alumno).localeCompare(nombreAlumno(b.alumno)))
    const total = conteoVacio()
    for (const f of filas) {
      total.asistio += f.conteo.asistio
      total.falta += f.conteo.falta
      total.justificada += f.conteo.justificada
    }
    return {
      ...base,
      metricas: [
        { etiqueta: "Alumnos", valor: filas.length },
        { etiqueta: "Mujeres", valor: filas.filter((f) => f.alumno.sexo === "M").length },
        { etiqueta: "Hombres", valor: filas.filter((f) => f.alumno.sexo === "H").length },
        { etiqueta: "Asistencia promedio", valor: asistenciaDe(total) == null ? "—" : `${asistenciaDe(total)}%` },
      ],
      columnas: [
        { clave: "folio", titulo: "Folio", ancho: 10 },
        { clave: "nombre", titulo: "Nombre", ancho: 32 },
        { clave: "curp", titulo: "CURP", ancho: 20 },
        { clave: "sexo", titulo: "Sexo", ancho: 10 },
        { clave: "edad", titulo: "Edad", tipo: "numero" },
        { clave: "grado", titulo: "Grado escolar", ancho: 18 },
        { clave: "tipoEscuela", titulo: "Tipo de escuela", ancho: 12 },
        { clave: "escuela", titulo: "Escuela", ancho: 28 },
        { clave: "tutor", titulo: "Tutor", ancho: 28 },
        { clave: "parentesco", titulo: "Parentesco", ancho: 14 },
        { clave: "telefono", titulo: "Teléfono", ancho: 14 },
        { clave: "cursos", titulo: "Cursos", ancho: 34 },
        { clave: "asistio", titulo: "Asistencias", tipo: "numero" },
        { clave: "falta", titulo: "Faltas", tipo: "numero" },
        { clave: "justificada", titulo: "Justificadas", tipo: "numero" },
        { clave: "asistencia", titulo: "Asistencia", tipo: "porcentaje" },
      ],
      filas: filas.map((f) => ({
        folio: folioAlumno(f.alumno.id),
        nombre: nombreAlumno(f.alumno),
        curp: f.alumno.curp,
        sexo: label(SEXOS, f.alumno.sexo),
        edad: edadEn(aISO(f.alumno.fechaNacimiento)!, hoy),
        grado: f.alumno.gradoEscolar ? label(GRADOS_ESCOLARES, f.alumno.gradoEscolar) : "",
        tipoEscuela: f.alumno.tipoEscuela ? label(TIPOS_ESCUELA, f.alumno.tipoEscuela) : "",
        escuela: f.alumno.escuela,
        tutor: f.alumno.tutorNombre,
        parentesco: label(PARENTESCOS, f.alumno.tutorParentesco),
        telefono: f.alumno.tutorTelefono,
        cursos: f.cursos.join(", "),
        asistio: f.conteo.asistio,
        falta: f.conteo.falta,
        justificada: f.conteo.justificada,
        asistencia: asistenciaDe(f.conteo),
      })),
    }
  }

  if (p.tipo === "asistencia") {
    const filas = cursos
      .flatMap((c) =>
        c.sesiones.map((s) => {
          const conteo = conteoVacio()
          for (const a of s.asistencias) sumar(conteo, a.estado)
          const fecha = aISO(s.fecha)!
          return {
            fecha,
            dia: DIAS_SEMANA.find((d) => d.js === s.fecha.getUTCDay())?.label ?? "",
            clase: c.clase.nombre,
            profesor: c.profesor.nombre,
            horario: `${c.horaInicio}–${c.horaFin}`,
            tema: s.tema,
            lista: s.asistencias.length,
            asistio: conteo.asistio,
            falta: conteo.falta,
            justificada: conteo.justificada,
            asistencia: asistenciaDe(conteo),
          }
        })
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horario.localeCompare(b.horario) || a.clase.localeCompare(b.clase))
    const total = conteoVacio()
    for (const f of filas) {
      total.asistio += f.asistio
      total.falta += f.falta
      total.justificada += f.justificada
    }
    return {
      ...base,
      metricas: [
        { etiqueta: "Clases impartidas", valor: filas.length },
        { etiqueta: "Asistencias", valor: num(total.asistio) },
        { etiqueta: "Faltas", valor: num(total.falta), nota: total.justificada ? `${total.justificada} justificadas aparte` : undefined },
        { etiqueta: "Asistencia promedio", valor: asistenciaDe(total) == null ? "—" : `${asistenciaDe(total)}%` },
      ],
      columnas: [
        { clave: "fecha", titulo: "Fecha", tipo: "fecha" },
        { clave: "dia", titulo: "Día", ancho: 11 },
        { clave: "clase", titulo: "Clase", ancho: 24 },
        { clave: "profesor", titulo: "Profesor", ancho: 28 },
        { clave: "horario", titulo: "Horario", ancho: 13 },
        { clave: "tema", titulo: "Tema", ancho: 30 },
        { clave: "lista", titulo: "En lista", tipo: "numero" },
        { clave: "asistio", titulo: "Asistieron", tipo: "numero" },
        { clave: "falta", titulo: "Faltas", tipo: "numero" },
        { clave: "justificada", titulo: "Justificadas", tipo: "numero" },
        { clave: "asistencia", titulo: "Asistencia", tipo: "porcentaje" },
      ],
      filas,
    }
  }

  if (p.tipo === "inscripciones") {
    const bajas = inscripcionesPeriodo.filter((i) => i.estatus === "baja").length
    return {
      ...base,
      metricas: [
        { etiqueta: "Inscripciones", valor: inscripcionesPeriodo.length },
        { etiqueta: "Alumnos distintos", valor: new Set(inscripcionesPeriodo.map((i) => i.alumnoId)).size },
        { etiqueta: "Siguen activas", valor: inscripcionesPeriodo.length - bajas },
        { etiqueta: "Dadas de baja", valor: bajas },
      ],
      columnas: [
        { clave: "fecha", titulo: "Fecha de inscripción", tipo: "fecha" },
        { clave: "folio", titulo: "Folio", ancho: 10 },
        { clave: "alumno", titulo: "Alumno", ancho: 32 },
        { clave: "curp", titulo: "CURP", ancho: 20 },
        { clave: "clase", titulo: "Clase", ancho: 24 },
        { clave: "profesor", titulo: "Profesor", ancho: 28 },
        { clave: "horario", titulo: "Días y horario", ancho: 28 },
        { clave: "inicio", titulo: "Inicio del curso", tipo: "fecha" },
        { clave: "fin", titulo: "Fin del curso", tipo: "fecha" },
        { clave: "estatus", titulo: "Estatus", ancho: 10 },
        { clave: "motivo", titulo: "Motivo de baja", ancho: 30 },
      ],
      filas: inscripcionesPeriodo.map((i) => ({
        fecha: aISO(i.fechaInscripcion),
        folio: folioAlumno(i.alumno.id),
        alumno: nombreAlumno(i.alumno),
        curp: i.alumno.curp,
        clase: i.curso.clase.nombre,
        profesor: i.curso.profesor.nombre,
        horario: textoHorario(i.curso.dias, i.curso.horaInicio, i.curso.horaFin),
        inicio: aISO(i.curso.fechaInicio),
        fin: aISO(i.curso.fechaFin),
        estatus: i.estatus === "baja" ? "Baja" : "Activa",
        motivo: i.motivoBaja,
      })),
    }
  }

  if (p.tipo === "clases" || p.tipo === "profesores") {
    const grupos = agrupar((c) => (p.tipo === "clases" ? c.clase : c.profesor))
    return {
      ...base,
      metricas: [
        { etiqueta: p.tipo === "clases" ? "Clases distintas" : "Profesores", valor: grupos.length },
        { etiqueta: "Cursos", valor: vigentes.length },
        { etiqueta: "Clases impartidas", valor: grupos.reduce((s, g) => s + g.impartidas, 0) },
        { etiqueta: "Horas impartidas", valor: num(redondear1(grupos.reduce((s, g) => s + g.horas, 0))) },
      ],
      columnas: [
        { clave: "nombre", titulo: p.tipo === "clases" ? "Clase" : "Profesor", ancho: 30 },
        { clave: "cursos", titulo: "Cursos", tipo: "numero" },
        { clave: "programadas", titulo: "Clases programadas", tipo: "numero" },
        { clave: "impartidas", titulo: "Clases impartidas", tipo: "numero" },
        { clave: "horas", titulo: "Horas impartidas", tipo: "numero" },
        { clave: "alumnos", titulo: "Alumnos", tipo: "numero" },
        { clave: "ocupacion", titulo: "Ocupación", tipo: "porcentaje" },
        { clave: "asistencia", titulo: "Asistencia", tipo: "porcentaje" },
      ],
      filas: grupos as unknown as Record<string, ValorCelda>[],
    }
  }

  // Resumen general
  const alumnosInscritos = new Set(vigentes.flatMap((c) => c.inscripciones.filter((i) => i.estatus === "activa").map((i) => i.alumno))) // por referencia
  const unicos = new Map(Array.from(alumnosInscritos).map((a) => [a.id, a]))
  const asistieron = new Set(vigentes.flatMap((c) => c.sesiones.flatMap((s) => s.asistencias.filter((a) => a.estado === "asistio").map((a) => a.alumnoId))))
  const total = conteoVacio()
  for (const c of vigentes) {
    total.asistio += c.conteo.asistio
    total.falta += c.conteo.falta
    total.justificada += c.conteo.justificada
  }
  const nuevos = primeras.filter((x) => {
    const f = x._min.fechaInscripcion ? aISO(x._min.fechaInscripcion)! : ""
    return f >= desde && f <= hasta
  }).length
  const iniciaron = vigentes.filter((c) => c.inicio >= desde && c.inicio <= hasta).length
  const cupo = vigentes.reduce((s, c) => s + c.cupo, 0)
  const inscritos = vigentes.reduce((s, c) => s + c.activos, 0)
  const asist = asistenciaDe(total)
  const alumnos = Array.from(unicos.values())

  return {
    ...base,
    metricas: [
      { etiqueta: "Cursos con clases en el periodo", valor: vigentes.length, nota: `${iniciaron} iniciaron en el periodo` },
      { etiqueta: "Cursos cancelados", valor: cursos.length - vigentes.length },
      { etiqueta: "Clases impartidas", valor: vigentes.reduce((s, c) => s + c.impartidas, 0), nota: `de ${vigentes.reduce((s, c) => s + c.programadas, 0)} programadas` },
      { etiqueta: "Horas de clase impartidas", valor: num(redondear1(vigentes.reduce((s, c) => s + c.horas, 0))) },
      { etiqueta: "Alumnos inscritos", valor: unicos.size, nota: `${inscritos} inscripciones en total` },
      { etiqueta: "Alumnos que asistieron", valor: asistieron.size },
      { etiqueta: "Alumnos nuevos", valor: nuevos, nota: "su primera inscripción fue en el periodo" },
      { etiqueta: "Inscripciones hechas", valor: inscripcionesPeriodo.length, nota: `${inscripcionesPeriodo.filter((i) => i.estatus === "baja").length} se dieron de baja` },
      { etiqueta: "Asistencia promedio", valor: asist == null ? "—" : `${asist}%`, nota: total.justificada ? `${total.justificada} faltas justificadas no cuentan` : undefined },
      { etiqueta: "Ocupación de los cursos", valor: `${pct(inscritos, cupo) ?? 0}%`, nota: `${inscritos} de ${cupo} lugares` },
      { etiqueta: "Mujeres / hombres", valor: `${alumnos.filter((a) => a.sexo === "M").length} / ${alumnos.filter((a) => a.sexo === "H").length}` },
    ],
    columnas: [
      { clave: "nombre", titulo: "Clase", ancho: 30 },
      { clave: "cursos", titulo: "Cursos", tipo: "numero" },
      { clave: "programadas", titulo: "Clases programadas", tipo: "numero" },
      { clave: "impartidas", titulo: "Clases impartidas", tipo: "numero" },
      { clave: "horas", titulo: "Horas impartidas", tipo: "numero" },
      { clave: "alumnos", titulo: "Alumnos", tipo: "numero" },
      { clave: "ocupacion", titulo: "Ocupación", tipo: "porcentaje" },
      { clave: "asistencia", titulo: "Asistencia", tipo: "porcentaje" },
    ],
    filas: agrupar((c) => c.clase) as unknown as Record<string, ValorCelda>[],
  }
}

/** Clases y profesores para los filtros del reporte (incluye los inactivos: hay historia). */
export async function opcionesReporte() {
  const [clases, profesores, primerCurso] = await Promise.all([
    prisma.stemClase.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.stemProfesor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.stemCurso.findFirst({ orderBy: { fechaInicio: "asc" }, select: { fechaInicio: true } }),
  ])
  return { clases, profesores, primerAnio: primerCurso ? primerCurso.fechaInicio.getUTCFullYear() : null }
}
