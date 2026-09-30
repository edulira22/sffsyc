-- Acomodo del 5º Informe DIF Municipal: bloques de sillas, invitados y
-- archivos. Aditivo y seguro: no toca ninguna tabla existente.
--
-- Los datos vienen del proyecto de layout (paquete_plataforma) y se cargan
-- con scripts/cargar-acomodo-informe.ts. Viven en la base y no en el
-- repositorio porque el repositorio es público y la lista de invitados es
-- información personal.

-- Bloques: A1…C12 y MEDIOS. La geometría casi no cambia; `grupos` y `nota`
-- son la asignación, que sí puede corregirse.
CREATE TABLE IF NOT EXISTS informe_bloques (
  id         TEXT PRIMARY KEY,
  orden      INTEGER NOT NULL,
  lugares    INTEGER NOT NULL,
  grupos     TEXT NOT NULL DEFAULT '',
  nota       TEXT NOT NULL DEFAULT '',
  d          TEXT NOT NULL,
  x          DOUBLE PRECISION NOT NULL,
  y          DOUBLE PRECISION NOT NULL,
  filas      JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- Invitados con su bloque. `bloques` admite varios, ['POR REVISAR'] o
-- vacío (tejedoras). `asistencia`: confirmado | no_asiste | sin_confirmar.
CREATE TABLE IF NOT EXISTS informe_invitados (
  id         SERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL,
  titulo     TEXT NOT NULL DEFAULT '',
  cargo      TEXT NOT NULL DEFAULT '',
  grupo      TEXT NOT NULL,
  bloques    TEXT[] NOT NULL DEFAULT '{}',
  asistencia TEXT NOT NULL DEFAULT 'sin_confirmar',
  nota       TEXT NOT NULL DEFAULT '',
  tejedora   BOOLEAN NOT NULL DEFAULT false,
  estatus    TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS informe_invitados_estatus_idx
  ON informe_invitados (estatus);

-- Archivos que no deben vivir en el repositorio público (la guía del staff
-- lista a los invitados confirmados). Se sirven por una ruta.
CREATE TABLE IF NOT EXISTS informe_archivos (
  nombre     TEXT PRIMARY KEY,
  tipo       TEXT NOT NULL,
  contenido  BYTEA NOT NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);
