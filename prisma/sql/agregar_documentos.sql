-- Status de documentos entregados por NNA (checklist). Aditiva y segura.
ALTER TABLE inscripciones_verano
  ADD COLUMN IF NOT EXISTS documentos JSONB NOT NULL DEFAULT '[]';
