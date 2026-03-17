-- ============================================================
-- DOMUS — Phase 2: Tablas para Dashboard
-- Ejecutar este SQL en el SQL Editor de Supabase.
-- ============================================================
-- NOTA: Tus tablas parents y children usan bigint como ID.
-- Estas 4 tablas nuevas siguen el mismo patrón.
-- ============================================================

-- 1. Tabla de tareas asignadas a hijos
CREATE TABLE IF NOT EXISTS tasks (
  id bigint generated always as identity primary key,
  parent_id bigint NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id bigint NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('academica', 'domestica')),
  points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date date DEFAULT CURRENT_DATE,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. Catálogo de recompensas creadas por el padre
CREATE TABLE IF NOT EXISTS rewards (
  id bigint generated always as identity primary key,
  parent_id bigint NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '🎁',
  points_cost integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Historial de canjes de recompensas
CREATE TABLE IF NOT EXISTS redemptions (
  id bigint generated always as identity primary key,
  reward_id bigint NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id bigint NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  points_spent integer NOT NULL,
  redeemed_at timestamptz DEFAULT now()
);

-- 4. Log de actividad (tareas completadas, puntos ganados)
CREATE TABLE IF NOT EXISTS activity_log (
  id bigint generated always as identity primary key,
  parent_id bigint NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id bigint NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  action text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_child ON tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_rewards_parent ON rewards(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_parent ON activity_log(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
