-- ============================================================
-- AI KOL SYSTEM — Migration 004: Style Templates
-- ============================================================
-- Prompt templates for quick image generation by style.
-- Users select a style, fill in variables, and generate.
-- ============================================================

CREATE TABLE IF NOT EXISTS kol_style_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'product_ad', 'beauty', 'fashion', 'food', 'lifestyle',
    'luxury', 'healthcare', 'education', 'general'
  )),
  thumbnail_url TEXT,
  prompt_template TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  default_settings JSONB NOT NULL DEFAULT '{}',
  example_output_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kol_style_templates_user ON kol_style_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_kol_style_templates_category ON kol_style_templates(category);
CREATE INDEX IF NOT EXISTS idx_kol_style_templates_public ON kol_style_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_kol_style_templates_deleted ON kol_style_templates(deleted_at);

-- Generated images from style templates
CREATE TABLE IF NOT EXISTS kol_style_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES kol_style_templates(id) ON DELETE CASCADE,
  filled_variables JSONB NOT NULL DEFAULT '{}',
  final_prompt TEXT NOT NULL,
  reference_image_url TEXT,
  output_urls JSONB NOT NULL DEFAULT '[]',
  output_storage_paths JSONB NOT NULL DEFAULT '[]',
  provider TEXT,
  model TEXT,
  generation_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'queued', 'processing', 'completed', 'failed'
  )),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kol_style_generations_user ON kol_style_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_kol_style_generations_template ON kol_style_generations(template_id);

-- Triggers
DO $$
BEGIN
  EXECUTE format(
    'DROP TRIGGER IF EXISTS trg_kol_style_templates_updated_at ON kol_style_templates'
  );
  EXECUTE format(
    'CREATE TRIGGER trg_kol_style_templates_updated_at
     BEFORE UPDATE ON kol_style_templates
     FOR EACH ROW EXECUTE FUNCTION kol_update_updated_at()'
  );
END;
$$;

-- RLS
ALTER TABLE kol_style_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_style_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kol_style_templates_policy ON kol_style_templates;
CREATE POLICY kol_style_templates_policy ON kol_style_templates
  FOR ALL
  USING (auth.uid() = user_id OR is_public = true)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS kol_style_generations_policy ON kol_style_generations;
CREATE POLICY kol_style_generations_policy ON kol_style_generations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
