-- ══════════════════════════════════════════════════════════════
-- FREELANCE AI ASSISTANT — Schema SQL para Supabase (PostgreSQL)
-- ══════════════════════════════════════════════════════════════
--
-- Instrucciones:
--   1. Ve a https://app.supabase.com → Tu proyecto → SQL Editor
--   2. Pega este script completo y ejecuta (Run)
--   3. Listo — todas las tablas, relaciones e índices quedan creados
--
-- Notas de diseño:
--   - Usamos UUID como PK para compatibilidad con auth de Supabase
--   - Row Level Security (RLS) habilitado en todas las tablas
--   - Las políticas de RLS usan auth.uid() → cada usuario ve solo sus datos
--   - Si no usas auth por ahora, las políticas permiten acceso público (modo demo)
-- ══════════════════════════════════════════════════════════════


-- ─── Extensión UUID ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ════════════════════════════════════════════════════════════
-- TABLA: freelancer_profile
-- Datos del freelancer dueño de la instancia
-- Solo hay un registro por usuario (relación 1-1 con auth.users)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS freelancer_profile (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name        TEXT NOT NULL DEFAULT 'Freelancer',
  email       TEXT,
  phone       TEXT,
  role        TEXT DEFAULT 'Freelancer',      -- Ej: "Full Stack Dev", "Diseñador UX"
  bio         TEXT,
  hourly_rate NUMERIC(10,2),                  -- Tarifa por hora en USD
  currency    TEXT DEFAULT 'USD',

  avatar_url  TEXT,
  website     TEXT,
  location    TEXT,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único: un perfil por usuario
CREATE UNIQUE INDEX IF NOT EXISTS freelancer_profile_user_idx
  ON freelancer_profile(user_id);

-- RLS
ALTER TABLE freelancer_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario puede ver su perfil"
  ON freelancer_profile FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Usuario puede editar su perfil"
  ON freelancer_profile FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);


-- ════════════════════════════════════════════════════════════
-- TABLA: clients
-- Clientes del freelancer
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  website     TEXT,
  address     TEXT,
  notes       TEXT,

  status      TEXT DEFAULT 'active'            -- 'active' | 'inactive' | 'prospect'
              CHECK (status IN ('active', 'inactive', 'prospect')),

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS clients_user_idx    ON clients(user_id);
CREATE INDEX IF NOT EXISTS clients_status_idx  ON clients(status);
CREATE INDEX IF NOT EXISTS clients_name_idx    ON clients(name);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a clientes propios"
  ON clients FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);


-- ════════════════════════════════════════════════════════════
-- TABLA: projects
-- Proyectos del freelancer, asociados a clientes
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,

  name        TEXT NOT NULL,
  description TEXT,

  status      TEXT DEFAULT 'in_progress'
              CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled', 'on_hold')),

  budget      NUMERIC(12,2),                   -- Presupuesto acordado
  currency    TEXT DEFAULT 'USD',

  start_date  DATE,
  deadline    DATE,
  ended_at    TIMESTAMPTZ,

  notes       TEXT,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS projects_user_idx    ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_client_idx  ON projects(client_id);
CREATE INDEX IF NOT EXISTS projects_status_idx  ON projects(status);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a proyectos propios"
  ON projects FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);


-- ════════════════════════════════════════════════════════════
-- TABLA: tasks
-- Tareas y recordatorios del freelancer
-- Pueden estar asociadas a un proyecto y/o cliente
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id   UUID REFERENCES clients(id)  ON DELETE SET NULL,

  title       TEXT NOT NULL,
  description TEXT,

  status      TEXT DEFAULT 'pending'
              CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),

  priority    TEXT DEFAULT 'medium'
              CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  due_date    TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  is_reminder BOOLEAN DEFAULT FALSE,           -- ¿Es un recordatorio?
  reminder_at TIMESTAMPTZ,                     -- Cuándo enviar el recordatorio

  tags        TEXT[],                          -- Etiquetas: ['diseño', 'urgente']

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS tasks_user_idx      ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_project_idx   ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx    ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx  ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_priority_idx  ON tasks(priority);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a tareas propias"
  ON tasks FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);


-- ════════════════════════════════════════════════════════════
-- TABLA: conversations
-- Conversaciones del chatbot
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  title       TEXT DEFAULT 'Nueva conversación',
  summary     TEXT,                            -- Resumen auto-generado por la IA

  is_archived BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS conversations_user_idx    ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_idx ON conversations(updated_at DESC);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a conversaciones propias"
  ON conversations FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);


-- ════════════════════════════════════════════════════════════
-- TABLA: messages
-- Mensajes individuales de cada conversación
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  role             TEXT NOT NULL
                   CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,

  -- Metadatos opcionales del mensaje
  model_used       TEXT,                       -- Qué modelo respondió (gpt-4o, claude-opus...)
  tokens_used      INTEGER,                    -- Tokens consumidos (para tracking de costos)
  latency_ms       INTEGER,                    -- Tiempo de respuesta en ms

  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS messages_conv_idx     ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_idx  ON messages(created_at);

-- RLS: acceso vía la conversación (hereda permisos)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso a mensajes via conversación"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );


-- ════════════════════════════════════════════════════════════
-- FUNCIÓN: updated_at automático
-- Actualiza el campo updated_at en cada UPDATE
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica el trigger a todas las tablas con updated_at
CREATE TRIGGER set_updated_at_freelancer_profile
  BEFORE UPDATE ON freelancer_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════════════════
-- DATOS DE EJEMPLO (opcional — comenta si no los necesitas)
-- ════════════════════════════════════════════════════════════

-- Perfil del freelancer
INSERT INTO freelancer_profile (name, email, role, hourly_rate)
VALUES ('Tu Nombre', 'tucorreo@ejemplo.com', 'Full Stack Developer', 50)
ON CONFLICT DO NOTHING;

-- Cliente de ejemplo
INSERT INTO clients (name, email, company, status)
VALUES
  ('Ana García',   'ana@empresa.com',   'Empresa Tech S.A.',  'active'),
  ('Carlos López', 'carlos@startup.io', 'Startup Creativa',   'active'),
  ('María Ruiz',   'maria@agencia.net', 'Agencia Digital',    'prospect')
ON CONFLICT DO NOTHING;

-- Proyecto de ejemplo (requiere que el cliente exista)
INSERT INTO projects (name, description, status, deadline)
VALUES
  ('Rediseño Web',    'Rediseño completo del sitio corporativo',   'in_progress', NOW() + INTERVAL '30 days'),
  ('App Móvil MVP',   'Desarrollo del MVP de la app para iOS/Android', 'pending', NOW() + INTERVAL '60 days'),
  ('Campaña SEO',     'Optimización SEO Q1 2025',                   'done',        NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Tareas de ejemplo
INSERT INTO tasks (title, status, priority, due_date)
VALUES
  ('Revisar contrato cliente nuevo',     'pending',     'high',   NOW() + INTERVAL '2 days'),
  ('Enviar propuesta de diseño',          'in_progress', 'medium', NOW() + INTERVAL '5 days'),
  ('Reunión semanal de seguimiento',      'pending',     'medium', NOW() + INTERVAL '1 day'),
  ('Actualizar portafolio con proyecto X','pending',     'low',    NOW() + INTERVAL '14 days'),
  ('Facturar a cliente Ana García',       'pending',     'urgent', NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
