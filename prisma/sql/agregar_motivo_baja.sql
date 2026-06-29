-- Motivo de baja del NNA (cuando estatus = 'baja'). Aditiva y segura.
ALTER TABLE inscripciones_verano
  ADD COLUMN IF NOT EXISTS motivo_baja TEXT;
