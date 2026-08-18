CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_imcan_rows_versa_router_name_lower
  ON public.imcan_rows ((lower(coalesce(row_data->>'versa_router_name', row_data->>'routername', row_data->>'Router Name', ''))));

CREATE INDEX IF NOT EXISTS idx_imcan_rows_old_router_name_lower
  ON public.imcan_rows ((lower(coalesce(row_data->>'old_router_name', row_data->>'Old Router Name', ''))));

CREATE INDEX IF NOT EXISTS idx_imcan_rows_site_id_lower
  ON public.imcan_rows ((lower(coalesce(row_data->>'site_id', row_data->>'SITE ID', row_data->>'Site ID', ''))));

CREATE INDEX IF NOT EXISTS idx_imcan_rows_search_text_trgm
  ON public.imcan_rows USING gin (search_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_imcan_rows_search_vector_gin
  ON public.imcan_rows USING gin (search_vector);
