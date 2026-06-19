import type { RolUsuario } from "@prisma/client"

// =============================================================================
//  Reglas de permisos por rol — fuente única de verdad.
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

/** Solo el administrador gestiona usuarios y zonas del sistema. */
export const puedeAdministrar = (rol: RolUsuario) => rol === "admin"

/** Admin y coordinación general gestionan los catálogos. */
export const puedeGestionarCatalogos = (rol: RolUsuario) =>
  rol === "admin" || rol === "coordinacion_general"

/** Quién puede crear/editar centros (la zona limita el alcance, no el permiso). */
export const puedeEditarCentros = (rol: RolUsuario) =>
  rol === "admin" || rol === "coordinacion_general" || rol === "coordinadora_zona"

/** Quién puede crear/editar beneficiarios e inscripciones. */
export const puedeEditarBeneficiarios = (rol: RolUsuario) => rol !== undefined // todos los roles del MVP

/** La coordinadora de zona ve únicamente lo de su zona. */
export const esCoordinadoraZona = (rol: RolUsuario) => rol === "coordinadora_zona"

/** Oficina es de solo lectura sobre centros/catálogos (edita beneficiarios). */
export const esSoloLecturaCentros = (rol: RolUsuario) => rol === "oficina"
