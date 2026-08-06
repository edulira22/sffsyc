-- Nombre opcional de quien contesta la encuesta de padres.
-- Si la columna queda en NULL o vacía, la respuesta es anónima.
-- Aditivo y seguro.

ALTER TABLE encuestas_padres_verano
  ADD COLUMN IF NOT EXISTS nombre TEXT;
