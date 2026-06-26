-- Tabla del expediente de inscripción a "Verano DIFertido 2026".
-- Aditiva y segura: no toca ninguna tabla existente.
CREATE TABLE IF NOT EXISTS inscripciones_verano (
  id                     SERIAL PRIMARY KEY,
  nombre                 TEXT NOT NULL,
  curp                   TEXT,
  fecha_nacimiento       DATE NOT NULL,
  talla                  TEXT,
  grupo                  TEXT,
  fecha_inscripcion      DATE NOT NULL DEFAULT CURRENT_DATE,
  padre                  TEXT,
  celular_padre          TEXT,
  madre                  TEXT,
  celular_madre          TEXT,
  telefono_casa          TEXT,
  celular_whatsapp       TEXT,
  domicilio              TEXT,
  autorizados            JSONB NOT NULL DEFAULT '[]',
  enfermedades           TEXT,
  impide_actividad       TEXT,
  medicamentos           TEXT,
  alergias               TEXT,
  nombre_servicio_medico TEXT,
  numero_servicio_medico TEXT,
  nombre_medico          TEXT,
  telefono_medico        TEXT,
  nombre_firma           TEXT NOT NULL,
  acepta_reglamento      BOOLEAN NOT NULL DEFAULT false,
  estatus                TEXT NOT NULL DEFAULT 'activa',
  created_at             TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at             TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inscripciones_verano_estatus_idx
  ON inscripciones_verano (estatus);
