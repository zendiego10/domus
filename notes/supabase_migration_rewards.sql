-- ============================================================
-- DOMUS — Migración: Sistema de Recompensas Completo
-- Ejecutar este SQL en el SQL Editor de Supabase.
-- ============================================================

-- 1. Agregar fecha de vencimiento a recompensas
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Agregar hijo objetivo (NULL = todos los hijos del padre)
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS child_id bigint REFERENCES children(id) ON DELETE CASCADE;

-- 3. Nueva tabla de solicitudes de canje
CREATE TABLE IF NOT EXISTS reward_requests (
  id bigint generated always as identity primary key,
  reward_id bigint NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id bigint NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id bigint NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 4. Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_reward_requests_parent ON reward_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_child ON reward_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_status ON reward_requests(status);
CREATE INDEX IF NOT EXISTS idx_rewards_child ON rewards(child_id);
