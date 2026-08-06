// =============================================================================
//  Formato ideal de intercambio en Excel — fuente única de verdad.
//  Define, por entidad, las columnas (encabezado en español, orden, ejemplo y
//  si es obligatoria). Tanto la EXPORTACIÓN como la IMPORTACIÓN y las PLANTILLAS
//  se generan a partir de aquí, para que todo sea consistente.
//
//  Principio de diseño: en Excel las relaciones se expresan con datos legibles
//  (la zona por su nombre, la categoría por su nombre, el beneficiario por su
//  CURP), nunca con IDs internos. La importación los resuelve a llaves foráneas.
// =============================================================================

import { PREGUNTAS_ENCUESTA } from "@/lib/eventos/encuesta-padres"

export type ColumnaExcel = {
  clave: string
  encabezado: string
  ancho?: number
  ejemplo?: string
  requerida?: boolean
  /** Texto de ayuda / vocabulario controlado (se muestra en la plantilla). */
  nota?: string
}

export type EntidadExcel = {
  id: string
  titulo: string
  hoja: string
  descripcion: string
  columnas: ColumnaExcel[]
}

export const ENTIDADES_EXCEL: Record<string, EntidadExcel> = {
  coordinadoras: {
    id: "coordinadoras",
    titulo: "Coordinadoras",
    hoja: "Coordinadoras",
    descripcion: "Coordinadoras generales, de zona y de centro.",
    columnas: [
      { clave: "nombre", encabezado: "Nombre(s)", ancho: 24, requerida: true, ejemplo: "María Guadalupe" },
      { clave: "apellidoPaterno", encabezado: "Apellido paterno", ancho: 20, requerida: true, ejemplo: "Mendoza" },
      { clave: "apellidoMaterno", encabezado: "Apellido materno", ancho: 20, ejemplo: "Ríos" },
      { clave: "telefono", encabezado: "Teléfono", ancho: 16, ejemplo: "614 000 0000" },
      { clave: "rol", encabezado: "Rol", ancho: 16, requerida: true, ejemplo: "centro", nota: "general | zona | centro" },
      { clave: "zona", encabezado: "Zona", ancho: 14, ejemplo: "Norte A", nota: "Solo si el rol es 'zona'. Una de: Norte A, Norte B, Sur A, Sur B" },
    ],
  },
  clases: {
    id: "clases",
    titulo: "Clases",
    hoja: "Clases",
    descripcion: "Catálogo estandarizado de clases.",
    columnas: [
      { clave: "nombreOficial", encabezado: "Nombre oficial", ancho: 26, requerida: true, ejemplo: "Zumba" },
      { clave: "categoria", encabezado: "Categoría", ancho: 18, requerida: true, ejemplo: "Deportes", nota: "Debe existir: Deportes, Arte, Cultura, Salud, Computación…" },
      { clave: "variantesAlias", encabezado: "Variantes / alias", ancho: 28, ejemplo: "Baile aeróbico, Zumba fitness" },
      { clave: "descripcion", encabezado: "Descripción", ancho: 36, ejemplo: "" },
    ],
  },
  profesores: {
    id: "profesores",
    titulo: "Profesores",
    hoja: "Profesores",
    descripcion: "Profesores que imparten clases.",
    columnas: [
      { clave: "nombre", encabezado: "Nombre(s)", ancho: 24, requerida: true, ejemplo: "Juan Carlos" },
      { clave: "apellidoPaterno", encabezado: "Apellido paterno", ancho: 20, requerida: true, ejemplo: "García" },
      { clave: "apellidoMaterno", encabezado: "Apellido materno", ancho: 20, ejemplo: "López" },
      { clave: "telefono", encabezado: "Teléfono", ancho: 16, ejemplo: "614 000 0000" },
      { clave: "especialidad", encabezado: "Especialidad", ancho: 22, ejemplo: "Danza" },
      { clave: "observaciones", encabezado: "Observaciones", ancho: 30, ejemplo: "" },
    ],
  },
  centros: {
    id: "centros",
    titulo: "Centros",
    hoja: "Centros",
    descripcion: "Centros comunitarios y CEDEFAM.",
    columnas: [
      { clave: "nombre", encabezado: "Nombre del centro", ancho: 30, requerida: true, ejemplo: "Centro Comunitario Riberas" },
      { clave: "tipo", encabezado: "Tipo", ancho: 20, requerida: true, ejemplo: "Centro comunitario", nota: "Centro comunitario | CEDEFAM" },
      { clave: "zona", encabezado: "Zona", ancho: 14, requerida: true, ejemplo: "Norte A", nota: "Norte A, Norte B, Sur A, Sur B" },
      { clave: "coordinadora", encabezado: "Coordinadora del centro", ancho: 26, ejemplo: "Laura Mendoza", nota: "Nombre y apellido de una coordinadora con rol 'centro' (opcional)" },
      { clave: "direccion", encabezado: "Dirección", ancho: 32, ejemplo: "Calle Río Bravo 123, Col. Riberas" },
      { clave: "referenciaUbicacion", encabezado: "Referencia", ancho: 28, ejemplo: "Frente a la primaria" },
      { clave: "horarioGeneral", encabezado: "Horario general", ancho: 26, ejemplo: "Lunes a viernes 8:00-18:00" },
      { clave: "estatus", encabezado: "Estatus", ancho: 14, ejemplo: "activo", nota: "activo | inactivo | pendiente" },
      { clave: "observaciones", encabezado: "Observaciones", ancho: 30, ejemplo: "" },
    ],
  },
  beneficiarios: {
    id: "beneficiarios",
    titulo: "Beneficiarios",
    hoja: "Beneficiarios",
    descripcion: "Registro de personas beneficiarias. La edad NO se captura: se calcula.",
    columnas: [
      { clave: "apellidoPaterno", encabezado: "Apellido paterno", ancho: 20, requerida: true, ejemplo: "Hernández" },
      { clave: "apellidoMaterno", encabezado: "Apellido materno", ancho: 20, ejemplo: "Soto" },
      { clave: "nombres", encabezado: "Nombre(s)", ancho: 24, requerida: true, ejemplo: "Sofía" },
      { clave: "fechaNacimiento", encabezado: "Fecha de nacimiento", ancho: 18, requerida: true, ejemplo: "10/03/2015", nota: "Formato dd/mm/aaaa" },
      { clave: "curp", encabezado: "CURP", ancho: 22, ejemplo: "", nota: "18 caracteres (opcional pero recomendado para evitar duplicados)" },
      { clave: "telefono", encabezado: "Teléfono", ancho: 16, ejemplo: "614 000 0000" },
      { clave: "domicilio", encabezado: "Domicilio", ancho: 32, ejemplo: "" },
      { clave: "escolaridad", encabezado: "Escolaridad", ancho: 18, ejemplo: "Primaria", nota: "Sin escolaridad | Preescolar | Primaria | Secundaria | Preparatoria | Universidad | Otro" },
      { clave: "gradoEscolar", encabezado: "Grado escolar", ancho: 14, ejemplo: "3°" },
      { clave: "nombreEscuela", encabezado: "Escuela", ancho: 28, ejemplo: "" },
      { clave: "observaciones", encabezado: "Observaciones", ancho: 30, ejemplo: "" },
    ],
  },
  inscripciones: {
    id: "inscripciones",
    titulo: "Inscripciones",
    hoja: "Inscripciones",
    descripcion: "Inscripción de un beneficiario a una clase de un centro.",
    columnas: [
      { clave: "curp", encabezado: "CURP del beneficiario", ancho: 22, ejemplo: "", nota: "Identifica al beneficiario. Si no hay CURP, usa las 3 columnas de nombre + fecha." },
      { clave: "apellidoPaterno", encabezado: "Apellido paterno", ancho: 20, ejemplo: "Hernández", nota: "Solo si no hay CURP" },
      { clave: "nombres", encabezado: "Nombre(s)", ancho: 22, ejemplo: "Sofía", nota: "Solo si no hay CURP" },
      { clave: "fechaNacimiento", encabezado: "Fecha de nacimiento", ancho: 18, ejemplo: "10/03/2015", nota: "Solo si no hay CURP (dd/mm/aaaa)" },
      { clave: "centro", encabezado: "Centro", ancho: 30, requerida: true, ejemplo: "Centro Comunitario Riberas" },
      { clave: "clase", encabezado: "Clase", ancho: 22, requerida: true, ejemplo: "Zumba" },
      { clave: "fechaInscripcion", encabezado: "Fecha de inscripción", ancho: 18, ejemplo: "14/06/2026", nota: "dd/mm/aaaa (si se omite, se usa hoy)" },
    ],
  },

  // ── Verano DIFertido ──────────────────────────────────────────────────────
  "inscripciones-verano": {
    id: "inscripciones-verano",
    titulo: "Inscripciones Verano DIFertido",
    hoja: "Inscripciones Verano",
    descripcion: "Padrón completo de NNA inscritos al curso de verano.",
    columnas: [
      { clave: "folio",            encabezado: "Folio",                  ancho: 12 },
      { clave: "nombre",           encabezado: "Nombre del NNA",          ancho: 30 },
      { clave: "curp",             encabezado: "CURP",                   ancho: 20 },
      { clave: "fechaNacimiento",  encabezado: "Fecha de nacimiento",    ancho: 18 },
      { clave: "edad",             encabezado: "Edad",                   ancho: 8  },
      { clave: "talla",            encabezado: "Talla",                  ancho: 8  },
      { clave: "equipo",           encabezado: "Equipo",                 ancho: 14 },
      { clave: "primeraVez",       encabezado: "Primera vez",            ancho: 12 },
      { clave: "fechaInscripcion", encabezado: "Fecha de inscripción",   ancho: 18 },
      { clave: "estatus",          encabezado: "Estatus",                ancho: 10 },
      { clave: "docsEntregados",   encabezado: "Docs. entregados",       ancho: 14 },
      { clave: "reciboPago",       encabezado: "No. de recibo",          ancho: 16 },
      { clave: "padre",            encabezado: "Padre / Tutor legal",    ancho: 28 },
      { clave: "celularPadre",     encabezado: "Cel. padre/tutor",       ancho: 14 },
      { clave: "madre",            encabezado: "Madre / Tutora legal",   ancho: 28 },
      { clave: "celularMadre",     encabezado: "Cel. madre/tutora",      ancho: 14 },
      { clave: "telefonoCasa",     encabezado: "Tel. de casa",           ancho: 14 },
      { clave: "celularWhatsapp",  encabezado: "Cel. WhatsApp",          ancho: 14 },
      { clave: "domicilio",        encabezado: "Domicilio",              ancho: 32 },
      { clave: "autorizado1",      encabezado: "Autorizado 1",           ancho: 36 },
      { clave: "autorizado2",      encabezado: "Autorizado 2",           ancho: 36 },
      { clave: "autorizado3",      encabezado: "Autorizado 3",           ancho: 36 },
      { clave: "motivoBaja",       encabezado: "Motivo de baja",         ancho: 30 },
    ],
  },
  "personal-verano": {
    id: "personal-verano",
    titulo: "Personal Verano DIFertido",
    hoja: "Personal Verano",
    descripcion: "Maestros y staff del curso de verano.",
    columnas: [
      { clave: "nombre",   encabezado: "Nombre",       ancho: 28 },
      { clave: "tipo",     encabezado: "Tipo",          ancho: 12, nota: "Maestro | Staff / Apoyo" },
      { clave: "rol",      encabezado: "Rol / Puesto",  ancho: 22 },
      { clave: "telefono", encabezado: "Teléfono",     ancho: 14 },
      { clave: "estatus",  encabezado: "Estatus",      ancho: 10 },
    ],
  },
  // Las columnas se derivan de las preguntas: una por pregunta, en orden.
  "encuesta-padres-verano": {
    id: "encuesta-padres-verano",
    titulo: "Encuesta de padres — Verano DIFertido",
    hoja: "Encuesta padres",
    descripcion:
      "Respuestas de la encuesta de satisfacción de padres y tutores (anónima).",
    columnas: [
      { clave: "fecha", encabezado: "Fecha de respuesta", ancho: 20 },
      ...PREGUNTAS_ENCUESTA.map((p) => ({
        clave: p.id,
        encabezado: `${p.numero}. ${p.texto}`,
        ancho: p.tipo === "texto" ? 48 : p.tipo === "estrellas" ? 10 : 24,
      })),
    ],
  },
}

export const ORDEN_ENTIDADES = [
  "coordinadoras",
  "clases",
  "profesores",
  "centros",
  "beneficiarios",
  "inscripciones",
] as const
