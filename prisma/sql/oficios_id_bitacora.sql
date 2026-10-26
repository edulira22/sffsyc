-- ID que tenía el oficio en la bitácora anterior de Google Sheets (B{mes}-###).
-- Separado de numero_recepcion, que es el número que anota a mano la
-- Dirección del DIF Municipal al recibir el oficio (p. ej. 01319/26).
ALTER TABLE public.oficios ADD COLUMN IF NOT EXISTS id_bitacora TEXT NOT NULL DEFAULT '';
