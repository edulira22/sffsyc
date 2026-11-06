-- Áreas de Oficios que cada usuario puede ver (centros_comunitarios,
-- secretaria_tecnica, ...). Lista vacía = puede ver todas, igual que
-- areas_permitidas para las secciones.
ALTER TABLE public.usuarios_sistema
  ADD COLUMN IF NOT EXISTS areas_oficios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
