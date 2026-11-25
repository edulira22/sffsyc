"use client"

import { forwardRef, type ComponentProps } from "react"
import NextLink from "next/link"

/**
 * <Link> de Next sin pre-carga automática. Por defecto Next pide al servidor cada
 * página enlazada en cuanto el enlace aparece en pantalla; en una lista de 30
 * cursos u oficios eso son 30 peticiones (cada una revisa la sesión y consulta la
 * base) que se forman delante del clic real y vuelven lenta la plataforma.
 * Al dar clic, PantallaCargando cubre la espera al instante.
 * Para pre-cargar un enlace concreto: <Link prefetch>.
 */
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link({ prefetch = false, ...props }, ref) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />
})

export default Link
