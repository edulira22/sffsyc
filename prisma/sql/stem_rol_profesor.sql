-- Rol para los profesores del Centro STEM: entran a la plataforma pero solo
-- ven sus cursos (el middleware los limita a /stem/mis-cursos).
ALTER TYPE "RolUsuario" ADD VALUE IF NOT EXISTS 'profesor_stem';
