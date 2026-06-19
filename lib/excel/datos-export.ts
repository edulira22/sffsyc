import { prisma } from "@/lib/prisma"
import { formatoFecha } from "@/lib/fechas"
import { TIPO_CENTRO_LABEL } from "@/lib/schemas/centro"
import { ESCOLARIDAD_LABEL } from "@/lib/schemas/beneficiario"

// Convierte los registros de la base de datos al formato legible de las columnas
// de exportación (nombres en vez de IDs, fechas dd/mm/aaaa, etiquetas, etc.).

export async function obtenerFilasExport(
  entidadId: string
): Promise<Record<string, unknown>[]> {
  switch (entidadId) {
    case "coordinadoras": {
      const cs = await prisma.coordinadora.findMany({
        include: { zona: true },
        orderBy: [{ apellidoPaterno: "asc" }, { nombre: "asc" }],
      })
      return cs.map((c) => ({
        nombre: c.nombre,
        apellidoPaterno: c.apellidoPaterno,
        apellidoMaterno: c.apellidoMaterno ?? "",
        telefono: c.telefono ?? "",
        rol: c.rol,
        zona: c.zona?.nombre ?? "",
      }))
    }
    case "clases": {
      const cs = await prisma.catalogoClase.findMany({
        include: { categoria: true },
        orderBy: { nombreOficial: "asc" },
      })
      return cs.map((c) => ({
        nombreOficial: c.nombreOficial,
        categoria: c.categoria.nombre,
        variantesAlias: c.variantesAlias ?? "",
        descripcion: c.descripcion ?? "",
      }))
    }
    case "profesores": {
      const ps = await prisma.profesor.findMany({
        orderBy: [{ apellidoPaterno: "asc" }, { nombre: "asc" }],
      })
      return ps.map((p) => ({
        nombre: p.nombre,
        apellidoPaterno: p.apellidoPaterno,
        apellidoMaterno: p.apellidoMaterno ?? "",
        telefono: p.telefono ?? "",
        especialidad: p.especialidad ?? "",
        observaciones: p.observaciones ?? "",
      }))
    }
    case "centros": {
      const cs = await prisma.centro.findMany({
        include: { zona: true, coordinadora: true },
        orderBy: { nombre: "asc" },
      })
      return cs.map((c) => ({
        nombre: c.nombre,
        tipo: TIPO_CENTRO_LABEL[c.tipo],
        zona: c.zona.nombre,
        coordinadora: c.coordinadora
          ? `${c.coordinadora.nombre} ${c.coordinadora.apellidoPaterno}`
          : "",
        direccion: c.direccion ?? "",
        referenciaUbicacion: c.referenciaUbicacion ?? "",
        horarioGeneral: c.horarioGeneral ?? "",
        estatus: c.estatus,
        observaciones: c.observaciones ?? "",
      }))
    }
    case "beneficiarios": {
      const bs = await prisma.beneficiario.findMany({
        orderBy: [{ apellidoPaterno: "asc" }, { nombres: "asc" }],
      })
      return bs.map((b) => ({
        apellidoPaterno: b.apellidoPaterno,
        apellidoMaterno: b.apellidoMaterno ?? "",
        nombres: b.nombres,
        fechaNacimiento: formatoFecha(b.fechaNacimiento),
        curp: b.curp ?? "",
        telefono: b.telefono ?? "",
        domicilio: b.domicilio ?? "",
        escolaridad: b.escolaridad ? ESCOLARIDAD_LABEL[b.escolaridad] : "",
        gradoEscolar: b.gradoEscolar ?? "",
        nombreEscuela: b.nombreEscuela ?? "",
        observaciones: b.observaciones ?? "",
      }))
    }
    case "inscripciones": {
      const ins = await prisma.inscripcion.findMany({
        include: {
          beneficiario: true,
          claseCentro: { include: { clase: true, centro: true } },
        },
        orderBy: { fechaInscripcion: "desc" },
      })
      return ins.map((i) => ({
        curp: i.beneficiario.curp ?? "",
        apellidoPaterno: i.beneficiario.apellidoPaterno,
        nombres: i.beneficiario.nombres,
        fechaNacimiento: formatoFecha(i.beneficiario.fechaNacimiento),
        centro: i.claseCentro.centro.nombre,
        clase: i.claseCentro.clase.nombreOficial,
        fechaInscripcion: formatoFecha(i.fechaInscripcion),
      }))
    }
    default:
      return []
  }
}
