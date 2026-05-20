-- ============================================================
-- Domus Fase 3 — Migraciones SQL
-- Ejecutar en Supabase SQL Editor en el orden indicado.
-- Todas usan IF NOT EXISTS / IF EXISTS para ser idempotentes.
-- ============================================================

-- ── Módulo 1 (opcional): columnas de auditoría de hash ──────
ALTER TABLE parents   ADD COLUMN IF NOT EXISTS password_hashed_at TIMESTAMPTZ;
ALTER TABLE children  ADD COLUMN IF NOT EXISTS pin_hashed_at       TIMESTAMPTZ;

-- ── Módulo 4: verificación por foto en tareas ───────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS photo_url         TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;
-- Nota: el campo status ya es TEXT libre; 'pending_review' es un nuevo valor válido.

-- ── Módulo 5a: sistema de streaks ───────────────────────────
ALTER TABLE children ADD COLUMN IF NOT EXISTS current_streak      INT NOT NULL DEFAULT 0;
ALTER TABLE children ADD COLUMN IF NOT EXISTS last_activity_date  DATE;

-- ── Módulo 8: tareas recurrentes ────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_frequency  TEXT;
  -- Valores válidos: 'daily' | 'weekly'
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS template_task_id      BIGINT REFERENCES tasks(id);

-- Guard contra doble generación de instancias recurrentes:
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_recurring_template_date
  ON tasks (template_task_id, (due_date::date))
  WHERE template_task_id IS NOT NULL;

-- ── Módulo 9: tokens de recuperación de contraseña ──────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   BIGINT      NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_prt_token  ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_prt_parent ON password_reset_tokens (parent_id);

-- ── Supabase Storage: bucket task-photos ────────────────────
-- Ejecutar en el Dashboard de Supabase > Storage > New Bucket:
--   Nombre: task-photos
--   Public: true
-- O via SQL (requiere extensión storage habilitada):
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('task-photos', 'task-photos', true)
--   ON CONFLICT (id) DO NOTHING;
