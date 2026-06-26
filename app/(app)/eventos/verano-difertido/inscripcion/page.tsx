import { redirect } from "next/navigation"

// La inscripción ahora vive en la liga pública /verano (autoservicio + staff).
// Se conserva esta ruta solo para no romper enlaces antiguos.
export default function InscripcionVeranoRedirect() {
  redirect("/verano")
}
