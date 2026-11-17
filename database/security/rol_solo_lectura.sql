-- ============================================================================
-- Rol de solo lectura para el agente de datos (spec: "SQL de solo lectura")
-- Innovaciones Tecnológicas CR S.A · Mini Proyecto #2
--
-- Plantilla: el marcador __PASSWORD__ lo reemplaza backend/scripts/crear-rol-lectura.js,
-- que genera la contraseña y la guarda en backend/.env. La contraseña NUNCA se escribe
-- en este archivo ni se muestra en pantalla.
--
-- El script crea el rol si no existe y, después de este archivo, crea una política de
-- lectura (lectura_agente_datos) en cada tabla de public. RLS está activo, así que sin
-- esas políticas el rol no vería ninguna fila.
--
-- Efecto: el rol agente_lectura solo puede hacer SELECT.
-- ============================================================================

-- Supabase no permite cambiar atributos de superusuario; un rol nuevo ya nace sin SUPERUSER
-- y sin BYPASSRLS, así que solo se fijan el login y la contraseña.
ALTER ROLE agente_lectura WITH LOGIN PASSWORD '__PASSWORD__';

-- Limpia privilegios previos y concede solo lectura
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM agente_lectura;
GRANT USAGE ON SCHEMA public TO agente_lectura;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agente_lectura;

-- Las tablas que se creen después (migraciones futuras) también serán de solo lectura
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO agente_lectura;
