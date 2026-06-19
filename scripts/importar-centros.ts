import { PrismaClient, type TipoCentro } from "@prisma/client"

const prisma = new PrismaClient()

type Fila = {
  cc: string
  direccion: string
  tipo: string
  zona: string
  coordinadora: string
}

const DATOS: Fila[] = [
  { cc: "CHIHUAHUA 2000", direccion: "Simon Sarlat Nava 702, Chihuahua 2000 I Etapa, 31136 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "LETICIA NAVARRETE" },
  { cc: "CEDEFAM 2 DE JUNIO", direccion: "Electricistas s/n, 2 de Junio, 31134 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Norte A", coordinadora: "GUADALUPE VILLALOBOS LOYA" },
  { cc: "CEDEFAM EL PORVENIR", direccion: "Porvenir, Rio Sacramento Nte, 31137 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Norte A", coordinadora: "LAURA VANESSA AMADOR" },
  { cc: "LA VILLA", direccion: "Tarahumaras y Lucha Obrera, Francisco Villa, Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "ZUHEY SANCHEZ ORTIZ" },
  { cc: "NUEVO TRIUNFO", direccion: "Hda. S. Jerónimo 4707, Quintas Carolinas II Etapa,31140 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "GUADALUPE CORDOVA GUTIERREZ" },
  { cc: "QUINTAS CAROLINAS", direccion: "Monte Kenia, Quintas Carolinas I Etapa, 31146 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "LESLIE SUSANA RAMÍREZ TORRES" },
  { cc: "RIBERAS DEL SACRAMENTO", direccion: "Calle Rio San Francisco y Rio Gambia 22305. Fracc. Riberas de Sacramento, 31184 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "BIANCA YARELY CORRAL PEINADO" },
  { cc: "RODOLFO FIERRO", direccion: "C. C.D.P. 917, Rodolfo Fierro, 31137 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "ADRIANA ALEMAN VELAZQUEZ" },
  { cc: "SAHUAROS", direccion: "Av. Guillermo Prieto Luján s/n, Sahuaros, 31137 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "MAYRA LORENO FIERRO PEINADO" },
  { cc: "TRICENTENARIO", direccion: "Celia Andazola 14703, Chihuahua 2000 III Etapa, Chihuahua 2094, 31136 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "CECILIA GUTIERREZ JAQUEZ" },
  { cc: "VILLA FANTASÍA", direccion: "Av Paseo del Real 16700, Villa del Real, 31137 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "MONICA CONCEPCIÓN GONZÁLEZ SOTO" },
  { cc: "VILLA VIEJA", direccion: "Miguel Trillo s/n, Villa VIeja, 31134 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "NORMA SANTANA SANCHEZ" },
  { cc: "EL REY", direccion: "Parque Paseo del Real, De Los Reyes 1716, Vilas del Rey, Parque Ind Impulso Y Supra, 31180 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte A", coordinadora: "GLORIA ESTELA FRESCAS PALMA" },
  { cc: "CEDEFAM VALLARTA", direccion: "31120, Manuel González Cossío 7300, Nacional, Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Norte B", coordinadora: "RITA CECILIA CEPEDA" },
  { cc: "COLINAS DEL SOL", direccion: "Av. de las Águilas s/n, Colinas del Sol, Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "MARIA DEL SOCORRO HERNANDEZ BALDERRAMA" },
  { cc: "DIEGO LUCERO", direccion: "Diego Lucero, 31123 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "IRMA YOLANDA DELGADO LOZANO" },
  { cc: "GRANJAS", direccion: "Lerdo de Tejada 5923, Las Granjas, 31100 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "CECILIA IVONNE MUÑOZ GARCIA" },
  { cc: "INSURGENTES", direccion: "Unidad Popular 10210, Insurgentes, 31125 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "DANIELA ELIZABETH GONZALEZ SOTO" },
  { cc: "JARDINES DEL SAUCITO", direccion: "Sierra Torrecillas 3237, Bahías, Juventud Nte, 31123 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "ANABEL HERNANDEZ CARREON" },
  { cc: "LOMAS KARIKE", direccion: "Av Juan Escutia, Nacional, 31120 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "CLAUDIA LILI RASCON RAMIREZ" },
  { cc: "PANORÁMICO", direccion: "31107, Lamatepec 23202, Panorámico, Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "MARÍA HORTENSIA CARMONA HOLGUÍN" },
  { cc: "UNIDAD", direccion: "De La Administración 4001, Unidad, Juventud Nte, 31124 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "ROSALINDA ISLAS GARDUÑO" },
  { cc: "UNIDAD KARIKE", direccion: "Macahui 729, Karike, 31100 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "RITA CECILIA CEPEDA" },
  { cc: "VILLA NUEVA", direccion: "Hermanos Flores Magon s/n, Villa Nueva, 31400 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Norte B", coordinadora: "VERONICA MAGALY SALAS SALOMON" },
  { cc: "STEM MUNICIPAL SAN QUINTÍN", direccion: "Bahia San Quintin & Avenida Nuevo Milenio, Jardines Universidad II Etapa, Juventud Nte, 31124 Chihuahua, Chih.", tipo: "STEM", zona: "Norte B", coordinadora: "MAYRA GARRIDO ESPINOZA" },
  { cc: "AIRES DEL SUR", direccion: "Calle 102 1/2, C. Fernando Orozco &, Pavis Borunda, 31456 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Brenda Luisa Padilla Jordan" },
  { cc: "CAMPESINA", direccion: "Acueducto 4612, Zarco, 31020 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Cindy Bethany Ruiz Avila" },
  { cc: "CEDEFAM DALE", direccion: "C. Trigésimo Sexta 3402, Dale, RUTA SUR II, 31050 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Sur A", coordinadora: "Perla Aurora Gonzalez Torres" },
  { cc: "CERRO DE LA CRUZ", direccion: "C. 64 1812, Cerro de la Cruz, 31460 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Martha Janeth Mendoza Salazar" },
  { cc: "DÍAZ ORDAZ", direccion: "31034, C. Díaz Ordaz 5800, Gustavo Díaz Ordaz, Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Vanessa Hernandez Herrera" },
  { cc: "LÁZARO CÁRDENAS", direccion: "C. Rosaura Zapata 2024, Lázaro Cárdenas, 31063 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Alejandra Ramirez Batista" },
  { cc: "MARTÍN LÓPEZ", direccion: "16 de Sept. 2516, Alfredo Chávez, 31414 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Carmen Lizbeth Juarez Tapia" },
  { cc: "ROSARIO", direccion: "C. Tamborel 6526, Rosario, 31034 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Evangelina Aragon Garcia" },
  { cc: "VALLE DE LA MADRID", direccion: "C. 72ᵃ̵, Cerro de la Cruz, 31460 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Erika Angeles Jaquez" },
  { cc: "CEDEFAM MÁRMOL III BAROUSE", direccion: "Eusebio Castillo 8400, Mármol III, 31063 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Sur A", coordinadora: "Rosa Olivia Palacios Gameros" },
  { cc: "DESARROLLO URBANO", direccion: "Independencia 6607, Desarrollo Urbano, 31063 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur A", coordinadora: "Rosa Elvia Galaviz Dominguez" },
  { cc: "ARTURO GÁMIZ", direccion: "Fco. Villa 614, Cerro Cnel. II, Arturo Gámiz, 31375 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Melisa Chavez Otelo" },
  { cc: "CEDEFAM PUNTA ORIENTE", direccion: "M373+7Q, 31385 Punta Oriente, Chih.", tipo: "CEDEFAM", zona: "Sur B", coordinadora: "Ana Michelle Medina Perez" },
  { cc: "INDUSTRIAL", direccion: "C. Oaxaca 4104, Industrial, 31304 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Beatriz Adriana Perez Hernandez" },
  { cc: "LEALTAD I", direccion: "Lat. Pacheco 4603, Cerro Cnel. II, Lealtad I, 31370 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Maria Isabel Perez Hernandez" },
  { cc: "LEALTAD II", direccion: "C. 33 2445, Lealtad II, 31060 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Lorena Sanchez Marquez" },
  { cc: "CEDEFAM PALESTINA", direccion: "Av Palestina 9500, Tabalaopa, 31376 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Sur B", coordinadora: "Blanca Yuvia Ortega Legarreta" },
  { cc: "RANCHERÍA JUÁREZ", direccion: '"Las Canchas de Villa Juarez", C. Tercera, Villa Juárez, 31064 Chihuahua, Chih.', tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Leticia Robles Montoya" },
  { cc: "STEM MUNICIPAL MADERA 65", direccion: "Plan de Ayala s/n, Madera 65, Chihuahua, Chih.", tipo: "STEM", zona: "Sur B", coordinadora: "" },
  { cc: "CERRO PRIETO", direccion: "Oscar Ornelas 509, Cerro Prieto, 31310 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Gloria Isabel Miramontes Diaz" },
  { cc: "CEDEFAM VALLE DORADO", direccion: "Valle el Dorado, 31066 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Sur B", coordinadora: "Amalia Armenta Covarrubias" },
  { cc: "CEDEFAM VISTAS CERRO GRANDE", direccion: "C. 76 1/2 8413-8401, Vistas Cerro Grande, 31065 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Sur B", coordinadora: "Carla Yara Rodriguez Gonzalez" },
  { cc: "SANTA ROSA", direccion: "C. Sexta 3600, Santa Rosa, 31050 Chihuahua, Chih.", tipo: "Centro comunitario", zona: "Sur B", coordinadora: "Olga Lorena Treviño" },
  { cc: "CEDEFAM VIDA DIGNA", direccion: "C. Lenteja, Vida Digna, 31137 Chihuahua, Chih.", tipo: "CEDEFAM", zona: "Norte A", coordinadora: "" },
]

const TIPO_MAP: Record<string, TipoCentro> = {
  "centro comunitario": "centro_comunitario",
  cedefam: "cedefam",
  stem: "stem",
}

function limpiar(s: string): string {
  return s.replace(/\.+$/g, "").replace(/\s+/g, " ").trim()
}

// Separación heurística de nombre completo (estilo mexicano):
// los últimos 2 tokens son apellidos; el resto, el/los nombre(s).
function partirNombre(completo: string) {
  const t = limpiar(completo).split(" ").filter(Boolean)
  if (t.length === 2) return { nombre: t[0], apP: t[1], apM: null as string | null }
  if (t.length === 3) return { nombre: t[0], apP: t[1], apM: t[2] }
  return {
    nombre: t.slice(0, t.length - 2).join(" "),
    apP: t[t.length - 2],
    apM: t[t.length - 1],
  }
}

function titulo(s: string): string {
  // Normaliza MAYÚSCULAS a Capitalización por palabra (deja minúsculas tal cual).
  if (s !== s.toUpperCase()) return s
  return s
    .toLowerCase()
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ")
}

async function main() {
  console.log("📥 Importando centros…")

  const zonas = await prisma.zona.findMany()
  const zonaId = new Map(zonas.map((z) => [z.nombre, z.id]))

  const coordinadoraCache = new Map<string, number>()
  let centrosNuevos = 0
  let centrosOmitidos = 0
  let coordsNuevas = 0

  for (const fila of DATOS) {
    const zId = zonaId.get(fila.zona)
    if (!zId) {
      console.warn(`  ⚠ Zona no encontrada: ${fila.zona} (${fila.cc})`)
      continue
    }
    const tipo = TIPO_MAP[limpiar(fila.tipo).toLowerCase()]
    if (!tipo) {
      console.warn(`  ⚠ Tipo no válido: ${fila.tipo} (${fila.cc})`)
      continue
    }

    // Resolver / crear coordinadora (rol centro).
    let coordinadoraId: number | null = null
    const nombreCoord = limpiar(fila.coordinadora)
    if (nombreCoord) {
      const clave = nombreCoord.toLowerCase()
      if (coordinadoraCache.has(clave)) {
        coordinadoraId = coordinadoraCache.get(clave)!
      } else {
        const p = partirNombre(nombreCoord)
        const datos = {
          nombre: titulo(p.nombre),
          apellidoPaterno: titulo(p.apP),
          apellidoMaterno: p.apM ? titulo(p.apM) : null,
        }
        const existente = await prisma.coordinadora.findFirst({
          where: {
            rol: "centro",
            nombre: datos.nombre,
            apellidoPaterno: datos.apellidoPaterno,
          },
        })
        const coord =
          existente ??
          (await prisma.coordinadora.create({
            data: { ...datos, rol: "centro", estatus: "activa" },
          }))
        if (!existente) coordsNuevas++
        coordinadoraId = coord.id
        coordinadoraCache.set(clave, coord.id)
      }
    }

    // Crear centro si no existe (por nombre + zona).
    const yaExiste = await prisma.centro.findFirst({
      where: { nombre: fila.cc, zonaId: zId },
    })
    if (yaExiste) {
      centrosOmitidos++
      continue
    }
    await prisma.centro.create({
      data: {
        nombre: fila.cc,
        tipo,
        zonaId: zId,
        coordinadoraId,
        direccion: fila.direccion,
        estatus: "activo",
      },
    })
    centrosNuevos++
  }

  console.log(`✅ Centros nuevos: ${centrosNuevos}`)
  console.log(`↩  Centros ya existentes (omitidos): ${centrosOmitidos}`)
  console.log(`👤 Coordinadoras nuevas: ${coordsNuevas}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
