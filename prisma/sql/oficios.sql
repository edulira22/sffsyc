-- Módulo Oficios: bitácora de correspondencia recibida por la Subdirección.
-- Aditivo y seguro: no toca tablas existentes. Todas las tablas con RLS
-- (ver CLAUDE.md): sin políticas, solo la aplicación (postgres) las usa.

-- Un oficio recibido. El folio interno es OF{aa}-{consecutivo} y reinicia
-- cada año; se asigna al registrar el escaneo (como en oficialía de partes).
CREATE TABLE IF NOT EXISTS oficios (
  id                 SERIAL PRIMARY KEY,
  anio               INTEGER NOT NULL,
  consecutivo        INTEGER NOT NULL,
  numero_oficio      TEXT NOT NULL DEFAULT '',   -- número del remitente
  numero_recepcion   TEXT NOT NULL DEFAULT '',   -- anotado a mano al recibir
  fecha_documento    DATE,
  fecha_recepcion    DATE NOT NULL DEFAULT CURRENT_DATE,
  remitente          TEXT NOT NULL DEFAULT '',
  cargo_remitente    TEXT NOT NULL DEFAULT '',
  dependencia        TEXT NOT NULL DEFAULT '',
  dirigido_a         TEXT NOT NULL DEFAULT '',
  tipo               TEXT NOT NULL DEFAULT 'solicitud',
  asunto             TEXT NOT NULL DEFAULT '',
  resumen            TEXT NOT NULL DEFAULT '',
  area_responsable   TEXT NOT NULL DEFAULT 'por_definir',
  prioridad          TEXT NOT NULL DEFAULT 'normal',
  estado             TEXT NOT NULL DEFAULT 'recibido',
  requiere_respuesta BOOLEAN NOT NULL DEFAULT true,
  fecha_limite       DATE,
  respuesta_numero   TEXT NOT NULL DEFAULT '',
  respuesta_fecha    DATE,
  revisado           BOOLEAN NOT NULL DEFAULT false,
  ia_estado          TEXT NOT NULL DEFAULT 'pendiente',
  ia_campos_dudosos  TEXT[] NOT NULL DEFAULT '{}',
  ia_observacion     TEXT NOT NULL DEFAULT '',
  creado_por_id      INTEGER,
  creado_por_nombre  TEXT NOT NULL DEFAULT '',
  estatus            TEXT NOT NULL DEFAULT 'activo',
  created_at         TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at         TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT oficios_folio_unico UNIQUE (anio, consecutivo)
);
CREATE INDEX IF NOT EXISTS oficios_estado_idx ON oficios (estado);
CREATE INDEX IF NOT EXISTS oficios_recepcion_idx ON oficios (fecha_recepcion);

-- El escaneo, aparte para no cargar bytes al listar.
CREATE TABLE IF NOT EXISTS oficios_archivos (
  oficio_id       INTEGER PRIMARY KEY REFERENCES oficios(id),
  nombre_original TEXT NOT NULL,
  tipo            TEXT NOT NULL,
  tamano          INTEGER NOT NULL,
  contenido       BYTEA NOT NULL,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- Bitácora de seguimiento: quién hizo qué y cuándo. Nunca se edita.
CREATE TABLE IF NOT EXISTS oficios_movimientos (
  id             SERIAL PRIMARY KEY,
  oficio_id      INTEGER NOT NULL REFERENCES oficios(id),
  tipo           TEXT NOT NULL,
  descripcion    TEXT NOT NULL DEFAULT '',
  usuario_id     INTEGER,
  usuario_nombre TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oficios_movimientos_oficio_idx ON oficios_movimientos (oficio_id);

-- Cada llamada a la IA, con tokens y costo estimado (para vigilar el gasto
-- y aplicar el tope mensual).
CREATE TABLE IF NOT EXISTS oficios_lecturas (
  id                     SERIAL PRIMARY KEY,
  oficio_id              INTEGER REFERENCES oficios(id),
  modelo                 TEXT NOT NULL,
  tokens_entrada         INTEGER NOT NULL DEFAULT 0,
  tokens_salida          INTEGER NOT NULL DEFAULT 0,
  tokens_cache_lectura   INTEGER NOT NULL DEFAULT 0,
  tokens_cache_escritura INTEGER NOT NULL DEFAULT 0,
  costo_usd              DOUBLE PRECISION NOT NULL DEFAULT 0,
  exito                  BOOLEAN NOT NULL,
  error                  TEXT NOT NULL DEFAULT '',
  duracion_ms            INTEGER NOT NULL DEFAULT 0,
  created_at             TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oficios_lecturas_fecha_idx ON oficios_lecturas (created_at);

ALTER TABLE public.oficios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oficios_archivos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oficios_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oficios_lecturas    ENABLE ROW LEVEL SECURITY;
