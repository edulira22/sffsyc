-- Un colaborador se registra UNA sola vez, con todos sus familiares en el
-- mismo envío. La comprobación se hace en la base y no solo en el código,
-- para que dos envíos simultáneos (o un doble toque) no puedan colarse.
--
-- `colaborador_clave` guarda el nombre normalizado (sin acentos, en
-- minúsculas y con espacios colapsados). La calcula claveColaborador() en
-- lib/eventos/informe.ts.
--
-- El índice es PARCIAL: solo aplica a los registros activos, así que si un
-- registro se da de baja la persona puede volver a registrarse.
-- Se deja NULLable a propósito: Postgres considera cada NULL distinto, de modo
-- que una inserción directa sin clave no rompe, y el panel la señala como
-- posible duplicado.

ALTER TABLE registros_informe
  ADD COLUMN IF NOT EXISTS colaborador_clave TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS registros_informe_colaborador_unico
  ON registros_informe (colaborador_clave)
  WHERE estatus = 'activo';
