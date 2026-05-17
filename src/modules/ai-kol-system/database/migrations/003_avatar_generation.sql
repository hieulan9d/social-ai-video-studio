-- ============================================================
-- AI KOL SYSTEM — Migration 003: Avatar Generation System
-- ============================================================
-- Iterative AI avatar generation with version history
-- and identity locking.
-- ============================================================

-- ============================================================
-- 1. AVATAR SESSIONS
-- A session groups all generations for one KOL avatar workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_avatar_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'finalized', 'abandoned'
  )),
  current_version INTEGER NOT NULL DEFAULT 0,
  finalized_avatar_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kol_avatar_sessions_kol ON kol_avatar_sessions(kol_id);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_sessions_user ON kol_avatar_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_sessions_status ON kol_avatar_sessions(status);

-- ============================================================
-- 2. AVATAR GENERATIONS
-- Each generation is a single round of AI image generation.
-- Generations form a tree (parent_generation_id) for branching.
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_avatar_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES kol_avatar_sessions(id) ON DELETE CASCADE,
  parent_generation_id UUID REFERENCES kol_avatar_generations(id) ON DELETE SET NULL,
  version INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'completed', 'failed', 'cancelled'
  )),
  provider TEXT NOT NULL DEFAULT 'nanobanana',
  model TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  candidate_count INTEGER NOT NULL DEFAULT 1,
  selected_candidate_index INTEGER,
  selected BOOLEAN NOT NULL DEFAULT false,
  output_urls JSONB NOT NULL DEFAULT '[]',
  output_storage_paths JSONB NOT NULL DEFAULT '[]',
  raw_response JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kol_avatar_generations_session ON kol_avatar_generations(session_id);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_generations_parent ON kol_avatar_generations(parent_generation_id);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_generations_status ON kol_avatar_generations(status);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_generations_selected ON kol_avatar_generations(session_id, selected);

-- ============================================================
-- 3. AVATAR REFERENCE IMAGES
-- Reference images uploaded for a specific generation round.
-- Each image has a role (face, hair, makeup, outfit, style).
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_avatar_reference_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES kol_avatar_sessions(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES kol_avatar_generations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'face', 'hair', 'makeup', 'outfit', 'style', 'pose', 'general'
  )),
  storage_provider TEXT NOT NULL DEFAULT 'supabase',
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kol_avatar_refs_session ON kol_avatar_reference_images(session_id);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_refs_generation ON kol_avatar_reference_images(generation_id);
CREATE INDEX IF NOT EXISTS idx_kol_avatar_refs_role ON kol_avatar_reference_images(role);

-- ============================================================
-- 4. IDENTITY LOCKS
-- Once a KOL avatar is finalized, an identity lock is created.
-- This is the master reference for ALL future generations.
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_identity_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL UNIQUE REFERENCES kol_masters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES kol_avatar_sessions(id) ON DELETE SET NULL,
  source_generation_id UUID REFERENCES kol_avatar_generations(id) ON DELETE SET NULL,
  official_avatar_url TEXT NOT NULL,
  official_avatar_storage_path TEXT NOT NULL,
  official_avatar_bucket TEXT NOT NULL DEFAULT 'kol-avatars',
  visual_anchor JSONB NOT NULL DEFAULT '{}',
  consistency_rules JSONB NOT NULL DEFAULT '{}',
  face_lock JSONB NOT NULL DEFAULT '{}',
  reference_images JSONB NOT NULL DEFAULT '[]',
  prompt_history JSONB NOT NULL DEFAULT '[]',
  generation_history JSONB NOT NULL DEFAULT '[]',
  is_locked BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}',
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kol_identity_locks_kol ON kol_identity_locks(kol_id);
CREATE INDEX IF NOT EXISTS idx_kol_identity_locks_user ON kol_identity_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_kol_identity_locks_session ON kol_identity_locks(session_id);

-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'kol_avatar_sessions',
      'kol_avatar_generations',
      'kol_identity_locks'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION kol_update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE kol_avatar_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_avatar_generations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_avatar_reference_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_identity_locks           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kol_avatar_sessions_policy          ON kol_avatar_sessions;
DROP POLICY IF EXISTS kol_avatar_generations_policy       ON kol_avatar_generations;
DROP POLICY IF EXISTS kol_avatar_reference_images_policy  ON kol_avatar_reference_images;
DROP POLICY IF EXISTS kol_identity_locks_policy           ON kol_identity_locks;

CREATE POLICY kol_avatar_sessions_policy ON kol_avatar_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY kol_avatar_generations_policy ON kol_avatar_generations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_avatar_sessions s
    WHERE s.id = kol_avatar_generations.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_avatar_sessions s
    WHERE s.id = kol_avatar_generations.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY kol_avatar_reference_images_policy ON kol_avatar_reference_images
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_avatar_sessions s
    WHERE s.id = kol_avatar_reference_images.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_avatar_sessions s
    WHERE s.id = kol_avatar_reference_images.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY kol_identity_locks_policy ON kol_identity_locks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kol-avatars', 'kol-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for avatars (uses RLS to control writes)
DROP POLICY IF EXISTS kol_avatars_public_read ON storage.objects;
CREATE POLICY kol_avatars_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'kol-avatars');

DROP POLICY IF EXISTS kol_avatars_authenticated_write ON storage.objects;
CREATE POLICY kol_avatars_authenticated_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kol-avatars' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS kol_avatars_authenticated_delete ON storage.objects;
CREATE POLICY kol_avatars_authenticated_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'kol-avatars' AND auth.uid() IS NOT NULL
  );
