-- Registro de asistencia al Informe de la Sra. Karina.
-- Un renglón por colaborador del DIF, con su familiar invitado.
-- Aditivo y seguro: no toca ninguna tabla existente.

CREATE TABLE IF NOT EXISTS registros_informe (
  id          SERIAL PRIMARY KEY,
  colaborador TEXT NOT NULL,
  area        TEXT NOT NULL,
  invitado    TEXT NOT NULL,
  parentesco  TEXT NOT NULL,
  estatus     TEXT NOT NULL DEFAULT 'activo',
  created_at  TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registros_informe_created_idx
  ON registros_informe (created_at);
