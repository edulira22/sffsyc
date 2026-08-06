-- Encuesta de satisfacción para padres/tutores del Verano DIFertido.
-- Aditivo y seguro: no toca ninguna tabla existente.
-- Las respuestas van en un JSONB (preguntaId -> valor) para que cambiar el
-- cuestionario de un año a otro no requiera migrar la base.

CREATE TABLE IF NOT EXISTS encuestas_padres_verano (
  id         SERIAL PRIMARY KEY,
  respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS encuestas_padres_verano_created_idx
  ON encuestas_padres_verano (created_at);
