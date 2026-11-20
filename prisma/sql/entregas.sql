-- =============================================================================
--  Entregas: campañas de entrega (dulces, piñatas, cobijas…) y sus solicitudes
--  escaneadas. Nada se borra: todo lleva estatus. RLS activo sin políticas.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.entregas_campanas (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  anio         INTEGER NOT NULL,
  prefijo      TEXT NOT NULL UNIQUE,
  descripcion  TEXT NOT NULL DEFAULT '',
  -- [{ "clave": "dulces", "nombre": "Bolsitas de dulces", "disponible": 5410 }]
  articulos    JSONB NOT NULL DEFAULT '[]'::jsonb,
  estatus      TEXT NOT NULL DEFAULT 'abierta',
  creado_por   TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entregas_solicitudes (
  id               SERIAL PRIMARY KEY,
  campana_id       INTEGER NOT NULL REFERENCES public.entregas_campanas(id),
  consecutivo      INTEGER NOT NULL,
  fecha_solicitud  DATE,
  fecha_evento     DATE,
  categoria        TEXT NOT NULL DEFAULT 'por_definir',
  solicitante      TEXT NOT NULL DEFAULT '',
  cargo            TEXT NOT NULL DEFAULT '',
  organizacion     TEXT NOT NULL DEFAULT '',
  resumen          TEXT NOT NULL DEFAULT '',
  contacto         TEXT NOT NULL DEFAULT '',
  -- { "dulces": { "solicitado": 350, "autorizado": 250 } }
  cantidades       JSONB NOT NULL DEFAULT '{}'::jsonb,
  estado           TEXT NOT NULL DEFAULT 'recibida',
  fecha_entrega    DATE,
  recibio          TEXT NOT NULL DEFAULT '',
  observaciones    TEXT NOT NULL DEFAULT '',
  revisado         BOOLEAN NOT NULL DEFAULT false,
  ia_estado        TEXT NOT NULL DEFAULT 'pendiente',
  ia_campos_dudosos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ia_observacion   TEXT NOT NULL DEFAULT '',
  creado_por_id    INTEGER,
  creado_por       TEXT NOT NULL DEFAULT '',
  estatus          TEXT NOT NULL DEFAULT 'activa',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entregas_folio_unico UNIQUE (campana_id, consecutivo)
);

CREATE TABLE IF NOT EXISTS public.entregas_archivos (
  solicitud_id     INTEGER PRIMARY KEY REFERENCES public.entregas_solicitudes(id),
  nombre_original  TEXT NOT NULL,
  tipo             TEXT NOT NULL,
  tamano           INTEGER NOT NULL,
  contenido        BYTEA NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entregas_movimientos (
  id              SERIAL PRIMARY KEY,
  solicitud_id    INTEGER NOT NULL REFERENCES public.entregas_solicitudes(id),
  tipo            TEXT NOT NULL,
  descripcion     TEXT NOT NULL DEFAULT '',
  usuario_id      INTEGER,
  usuario_nombre  TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entregas_movimientos_solicitud ON public.entregas_movimientos (solicitud_id);

-- Lecturas de Lirabot (cuentan para la misma energía diaria que Oficios).
CREATE TABLE IF NOT EXISTS public.entregas_lecturas (
  id                      SERIAL PRIMARY KEY,
  solicitud_id            INTEGER NOT NULL REFERENCES public.entregas_solicitudes(id),
  modelo                  TEXT NOT NULL,
  tokens_entrada          INTEGER NOT NULL DEFAULT 0,
  tokens_salida           INTEGER NOT NULL DEFAULT 0,
  tokens_cache_lectura    INTEGER NOT NULL DEFAULT 0,
  tokens_cache_escritura  INTEGER NOT NULL DEFAULT 0,
  costo_usd               DOUBLE PRECISION NOT NULL DEFAULT 0,
  exito                   BOOLEAN NOT NULL DEFAULT false,
  error                   TEXT NOT NULL DEFAULT '',
  duracion_ms             INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entregas_campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_lecturas ENABLE ROW LEVEL SECURITY;
