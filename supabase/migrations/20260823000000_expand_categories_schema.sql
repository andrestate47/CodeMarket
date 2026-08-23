-- ==========================================
-- CODEMARKET - EXPAND CATEGORIES SCHEMA
-- Add parent_id, image_url, seo_title, seo_description to categories
-- ==========================================

ALTER TABLE IF EXISTS public.categories
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Create indexes for performant hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_sort ON public.categories(store_id, sort_order);
