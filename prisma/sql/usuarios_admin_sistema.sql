-- Quién puede administrar usuarios y contraseñas. Por defecto NADIE nuevo:
-- se marca a mano en Administración → Usuarios.
ALTER TABLE public.usuarios_sistema
  ADD COLUMN IF NOT EXISTS es_admin_sistema BOOLEAN NOT NULL DEFAULT false;
