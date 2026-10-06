-- Activa Row-Level Security en las tablas de eventos creadas por SQL.
--
-- Supabase publica las tablas del esquema `public` por su API REST
-- (PostgREST). Sin RLS, el rol `anon` podía leer, insertar y borrar en
-- ellas (aviso "rls_disabled_in_public" del Security Advisor).
--
-- Igual que el resto de las tablas de la plataforma: RLS activado y SIN
-- políticas, lo que niega todo a `anon` y `authenticated`. La aplicación
-- no se ve afectada porque Prisma se conecta como `postgres`, que tiene
-- BYPASSRLS. Idempotente.
--
-- IMPORTANTE: toda tabla nueva creada por SQL debe incluir su
-- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.

ALTER TABLE public.inscripciones_verano     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_verano          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clases_verano            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horario_verano           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuestas_padres_verano  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_informe        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_bloques          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_invitados        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_archivos         ENABLE ROW LEVEL SECURITY;
