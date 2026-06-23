import type { RolUsuario } from "@prisma/client"

// =============================================================================
//  Reglas de permisos — fuente única de verdad.
//  Se usan tanto en la UI (mostrar/ocultar) como en el servidor (autorizar).
//  La UI nunca es la única barrera: el servidor siempre re-verifica.
// =============================================================================

/** Nombre legible del rol para mostrar en la interfaz. */
export const NOMBRE_ROL: Record<RolUsuario, string> = {
  admin: "Administrador",
  coordinacion_general: "Coordinación General",
  coordinadora_zona: "Coordinadora de Zona",
  oficina: "Oficina",
}

// --- Permisos de área --------------------------------------------------------

/**
 * Determina si un usuario tiene acceso a un área de la plataforma.
 * Admin siempre tiene acceso a todo. Los demás deben tener el área en su lista.
 */
export function tieneAccesoArea(
  areaId: string,
  rol: RolUsuario,
  areasPermitidas: string[]
): boolean {
  if (rol === "admin") return true
  return areasPermitidas.includes(areaId)
}

/**
 * Calcula las áreas que debe tener un usuario al crearlo/editarlo.
 * - Admin: array vacío (acceso total, sin restricciones).
 * - Roles de CC: siempre incluye "centros-comunitarios" + lo que el admin agregue.
 */
export function calcularAreasPermitidas(
  rol: RolUsuario,
  areasSeleccionadas: string[]
): string[] {
  if (rol === "admin") return []
  const areas = new Set(areasSeleccionadas)
  // Los roles de CC siempre tienen acceso a Centros Comunitarios.
  areas.add("centros-comunitarios")
  return Array.from(areas)
}

// --- Permisos por rol --------------------------------------------------------

/** Solo el administrador gestiona usuarios y zonas del sistema. */
export const puedeAdministrar = (rol: RolUsuario) => rol === "admin"

/** Admin y coordinación general gestionan los catálogos. */
export const puedeGestionarCatalogos = (rol: RolUsuario) =>
  rol === "admin" || rol === "coordinacion_general"

/** Quién puede crear/editar centros (la zona limita el alcance, no el permiso). */
export const puedeEditarCentros = (rol: RolUsuario) =>
  rol === "admin" || rol === "coordinacion_general" || rol === "coordinadora_zona"

/** Quién puede crear/editar beneficiarios e inscripciones. */
export const puedeEditarBeneficiarios = (rol: RolUsuario) => rol !== undefined

/** La coordinadora de zona ve únicamente lo de su zona. */
export const esCoordinadoraZona = (rol: RolUsuario) => rol === "coordinadora_zona"

/** Oficina es de solo lectura sobre centros/catálogos (edita beneficiarios). */
export const esSoloLecturaCentros = (rol: RolUsuario) => rol === "oficina"
