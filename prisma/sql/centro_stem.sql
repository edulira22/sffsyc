-- =============================================================================
--  Centro STEM: clases, profesores, cursos, alumnos, inscripciones y asistencia.
--  Nada se borra: todo lleva estatus. RLS activo sin políticas (Prisma entra
--  como postgres; PostgREST/anon no puede leer ni escribir).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.stem_clases (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  resumen      TEXT NOT NULL DEFAULT '',
  edad_minima  INTEGER,
  edad_maxima  INTEGER,
  estatus      TEXT NOT NULL DEFAULT 'activa',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS stem_clases_nombre_unico ON public.stem_clases (nombre);

CREATE TABLE IF NOT EXISTS public.stem_profesores (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL UNIQUE REFERENCES public.usuarios_sistema(id),
  nombre      TEXT NOT NULL,
  telefono    TEXT NOT NULL DEFAULT '',
  notas       TEXT NOT NULL DEFAULT '',
  estatus     TEXT NOT NULL DEFAULT 'activo',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stem_profesor_clases (
  profesor_id  INTEGER NOT NULL REFERENCES public.stem_profesores(id),
  clase_id     INTEGER NOT NULL REFERENCES public.stem_clases(id),
  PRIMARY KEY (profesor_id, clase_id)
);

CREATE TABLE IF NOT EXISTS public.stem_alumnos (
  id                 SERIAL PRIMARY KEY,
  curp               TEXT NOT NULL UNIQUE,
  nombres            TEXT NOT NULL,
  apellido_paterno   TEXT NOT NULL,
  apellido_materno   TEXT NOT NULL DEFAULT '',
  fecha_nacimiento   DATE NOT NULL,
  sexo               TEXT NOT NULL,
  escuela            TEXT NOT NULL DEFAULT '',
  tipo_escuela       TEXT NOT NULL DEFAULT '',
  grado_escolar      TEXT NOT NULL DEFAULT '',
  tutor_nombre       TEXT NOT NULL,
  tutor_parentesco   TEXT NOT NULL,
  tutor_telefono     TEXT NOT NULL,
  telefono_alterno   TEXT NOT NULL DEFAULT '',
  tutor_correo       TEXT NOT NULL DEFAULT '',
  salud              TEXT NOT NULL DEFAULT '',
  observaciones      TEXT NOT NULL DEFAULT '',
  estatus            TEXT NOT NULL DEFAULT 'activo',
  creado_por_id      INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stem_cursos (
  id            SERIAL PRIMARY KEY,
  clase_id      INTEGER NOT NULL REFERENCES public.stem_clases(id),
  profesor_id   INTEGER NOT NULL REFERENCES public.stem_profesores(id),
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  dias          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  hora_inicio   TEXT NOT NULL,
  hora_fin      TEXT NOT NULL,
  cupo          INTEGER NOT NULL,
  notas         TEXT NOT NULL DEFAULT '',
  estatus       TEXT NOT NULL DEFAULT 'activo',
  motivo_cancelacion TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stem_cursos_profesor ON public.stem_cursos (profesor_id);

CREATE TABLE IF NOT EXISTS public.stem_inscripciones (
  id                 SERIAL PRIMARY KEY,
  curso_id           INTEGER NOT NULL REFERENCES public.stem_cursos(id),
  alumno_id          INTEGER NOT NULL REFERENCES public.stem_alumnos(id),
  fecha_inscripcion  DATE NOT NULL DEFAULT CURRENT_DATE,
  estatus            TEXT NOT NULL DEFAULT 'activa',
  motivo_baja        TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stem_inscripcion_unica UNIQUE (curso_id, alumno_id)
);
CREATE INDEX IF NOT EXISTS stem_inscripciones_alumno ON public.stem_inscripciones (alumno_id);

CREATE TABLE IF NOT EXISTS public.stem_sesiones (
  id                 SERIAL PRIMARY KEY,
  curso_id           INTEGER NOT NULL REFERENCES public.stem_cursos(id),
  fecha              DATE NOT NULL,
  tema               TEXT NOT NULL DEFAULT '',
  registrada_por     TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stem_sesion_unica UNIQUE (curso_id, fecha)
);

CREATE TABLE IF NOT EXISTS public.stem_asistencias (
  sesion_id   INTEGER NOT NULL REFERENCES public.stem_sesiones(id),
  alumno_id   INTEGER NOT NULL REFERENCES public.stem_alumnos(id),
  estado      TEXT NOT NULL,
  PRIMARY KEY (sesion_id, alumno_id)
);

ALTER TABLE public.stem_clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_profesor_clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_asistencias ENABLE ROW LEVEL SECURITY;
