import { prisma } from "@/lib/prisma"
import { formatoFecha, calcularEdad } from "@/lib/fechas"
import { TIPO_CENTRO_LABEL } from "@/lib/schemas/centro"
import { ESCOLARIDAD_LABEL } from "@/lib/schemas/beneficiario"
import { folioVerano, grupoPorId, TOTAL_DOCUMENTOS } from "@/lib/eventos/verano"
import type { AutorizadoVerano } from "@/lib/data/verano"

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
    case "inscripciones-verano": {
      const ins = await prisma.inscripcionVerano.findMany({
        orderBy: [{ estatus: "asc" }, { fechaInscripcion: "desc" }],
      })
      return ins.map((i) => {
        const auths = (i.autorizados as unknown as AutorizadoVerano[]) ?? []
        const fmtAuth = (a?: AutorizadoVerano) =>
          a?.nombre ? `${a.nombre}${a.parentesco ? ` (${a.parentesco})` : ""}${a.celular ? ` — ${a.celular}` : ""}` : ""
        const docs = (i.documentos as unknown as string[]) ?? []
        return {
          folio:            folioVerano(i.id),
          nombre:           i.nombre,
          curp:             i.curp ?? "",
          fechaNacimiento:  formatoFecha(i.fechaNacimiento),
          edad:             calcularEdad(i.fechaNacimiento),
          talla:            i.talla ?? "",
          equipo:           grupoPorId(i.grupo ?? "")?.nombre ?? i.grupo ?? "",
          primeraVez:       i.primeraVez ? "Sí" : "No",
          fechaInscripcion: formatoFecha(i.fechaInscripcion),
          estatus:          i.estatus === "activa" ? "Activa" : "Baja",
          docsEntregados:   `${docs.length}/${TOTAL_DOCUMENTOS}`,
          reciboPago:       i.reciboPago ?? "",
          padre:            i.padre ?? "",
          celularPadre:     i.celularPadre ?? "",
          madre:            i.madre ?? "",
          celularMadre:     i.celularMadre ?? "",
          telefonoCasa:     i.telefonoCasa ?? "",
          celularWhatsapp:  i.celularWhatsapp ?? "",
          domicilio:        i.domicilio ?? "",
          autorizado1:      fmtAuth(auths[0]),
          autorizado2:      fmtAuth(auths[1]),
          autorizado3:      fmtAuth(auths[2]),
          motivoBaja:       i.motivoBaja ?? "",
        }
      })
    }
    case "personal-verano": {
      const ps = await prisma.personalVerano.findMany({
        where: { estatus: "activo" },
        orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
      })
      return ps.map((p) => ({
        nombre:   p.nombre,
        tipo:     p.tipo === "maestro" ? "Maestro" : "Staff / Apoyo",
        rol:      p.rol ?? "",
        telefono: p.telefono ?? "",
        estatus:  p.estatus,
      }))
    }
    default:
      return []
  }
}
