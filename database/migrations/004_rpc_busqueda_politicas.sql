-- ============================================================================
-- Migración 004 · Búsqueda vectorial del RAG como función de base de datos (RPC)
-- Innovaciones Tecnológicas CR S.A · Mini Proyecto #2
--
-- El servidor llama esta función con supabase.rpc('buscar_fragmentos_politica', ...),
-- así el código del backend no contiene SQL. La lógica de similitud vive en la base.
-- Solo el rol service_role puede ejecutarla desde la API de Supabase.
-- Seguro de repetir: CREATE OR REPLACE.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION buscar_fragmentos_politica(consulta VECTOR(384), cantidad INTEGER DEFAULT 5)
RETURNS TABLE (
    codigo          TEXT,
    version         TEXT,
    seccion         INTEGER,
    seccion_titulo  TEXT,
    punto           TEXT,
    contenido       TEXT,
    por_validar     BOOLEAN,
    titulo          TEXT,
    enlace          TEXT,
    similitud       DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT f.codigo, f.version, f.seccion, f.seccion_titulo, f.punto, f.contenido, f.por_validar,
         d.titulo, d.enlace,
         1 - (f.embedding <=> consulta) AS similitud
    FROM fragmentos_politica f
    JOIN documentos_politica d ON d.id = f.documento_id
   WHERE d.eliminado = FALSE
   ORDER BY f.embedding <=> consulta
   LIMIT cantidad;
$$;

-- Solo la API de servicio puede invocarla (anon y authenticated no)
REVOKE EXECUTE ON FUNCTION buscar_fragmentos_politica(VECTOR, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION buscar_fragmentos_politica(VECTOR, INTEGER) TO service_role;

COMMIT;
