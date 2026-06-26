-- Agrega "primera vez en el curso" al expediente de verano. Aditiva y segura.
ALTER TABLE inscripciones_verano
  ADD COLUMN IF NOT EXISTS primera_vez BOOLEAN NOT NULL DEFAULT false;
