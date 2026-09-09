-- El Informe pasa de un invitado fijo por colaborador a una lista dinámica.
-- Los invitados viven en un JSONB: [{ nombre, parentesco }, ...], igual que
-- el patrón de `autorizados` en inscripciones_verano.
--
-- Las columnas `invitado` y `parentesco` se retiran porque son NOT NULL y
-- bloquearían los nuevos registros. Se ejecuta sobre una tabla vacía.

ALTER TABLE registros_informe
  ADD COLUMN IF NOT EXISTS invitados JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE registros_informe DROP COLUMN IF EXISTS invitado;
ALTER TABLE registros_informe DROP COLUMN IF EXISTS parentesco;
