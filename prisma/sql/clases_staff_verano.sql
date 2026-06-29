-- Módulo Clases y Staff del Verano DIFertido. Aditivo y seguro.

CREATE TABLE IF NOT EXISTS personal_verano (
  id         SERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'maestro',
  rol        TEXT,
  telefono   TEXT,
  estatus    TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clases_verano (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  maestro_id  INTEGER REFERENCES personal_verano(id) ON DELETE SET NULL,
  color       TEXT,
  estatus     TEXT NOT NULL DEFAULT 'activa',
  created_at  TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clases_verano_maestro_idx ON clases_verano (maestro_id);

CREATE TABLE IF NOT EXISTS horario_verano (
  id          SERIAL PRIMARY KEY,
  grupo       TEXT NOT NULL,
  dia         TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin    TEXT NOT NULL,
  clase_id    INTEGER NOT NULL REFERENCES clases_verano(id) ON DELETE CASCADE,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS horario_verano_grupo_idx ON horario_verano (grupo);
CREATE INDEX IF NOT EXISTS horario_verano_clase_idx ON horario_verano (clase_id);
