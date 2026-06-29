-- No. de recibo de pago del NNA (se captura en el expediente). Aditiva y segura.
ALTER TABLE inscripciones_verano
  ADD COLUMN IF NOT EXISTS recibo_pago TEXT;
