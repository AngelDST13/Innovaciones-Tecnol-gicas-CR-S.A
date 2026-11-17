-- ============================================================================
-- Seed 002 · Datos simulados de volumen (50 colaboradores, ~3 meses)
-- Innovaciones Tecnológicas CR S.A · Mini Proyecto #2
--
-- Requisitos: ejecutar después de schema.sql y migrations/002_volumen_y_campos.sql.
-- Reproducible: usa setseed(0.42). Idempotente: si ya existen colaboradores con el
-- dominio @simulado.innovacionescr.com, no inserta nada.
-- Todos los datos son ficticios. Ningún nombre ni correo corresponde a una persona real.
--
-- Escenarios que cubre (fecha de referencia: 17 de noviembre de 2026):
--   - Ausentes hoy por tipo y departamento (vacaciones, permiso, licencia, incapacidad).
--   - Solicitudes pendientes con más de 3 días sin respuesta.
--   - Incapacidades activas y días acumulados en el mes.
--   - Ingresos, salidas y ascensos de los últimos 3 meses.
--   - Colaboradores con más de 20 días de vacaciones disponibles (riesgo de pasivo).
--   - Juan Pablo Rojas Alvarado, para la pregunta 21 del banco.
--   - 250 consultas de chat en los últimos 30 días, para la tendencia del dashboard.
-- ============================================================================

DO $seed$
DECLARE
  hoy           DATE := DATE '2026-11-17';
  nombres       TEXT[] := ARRAY['Sofía', 'Diego', 'Valeria', 'Andrés', 'Daniela', 'Jorge', 'Paola', 'Mauricio',
                                'Fernanda', 'Ricardo', 'Gabriela', 'Esteban', 'Natalia', 'Kevin', 'Laura', 'Óscar',
                                'Carolina', 'Felipe', 'Melissa', 'Bryan', 'Patricia', 'Alonso', 'Viviana', 'Rodrigo'];
  apellidos     TEXT[] := ARRAY['Solano', 'Jiménez', 'Mora', 'Vargas', 'Chaves', 'Araya', 'Campos', 'Brenes',
                                'Quirós', 'Hernández', 'Villalobos', 'Salas', 'Ramírez', 'Umaña', 'Cordero', 'Montero'];
  departamentos TEXT[] := ARRAY['Tecnología', 'Finanzas', 'Operaciones', 'Ventas', 'Marketing'];
  puestos       TEXT[] := ARRAY['Analista', 'Coordinador', 'Especialista', 'Asistente', 'Jefe de área'];
  temas_politica TEXT[] := ARRAY['vacaciones', 'permisos', 'incapacidades', 'teletrabajo', 'aguinaldo', 'beneficios', 'acoso'];
  preguntas_politica TEXT[] := ARRAY[
    '¿Cuántos días de vacaciones me corresponden al año?',
    '¿Puedo acumular vacaciones para el próximo año?',
    '¿Cuántos días de permiso tengo por fallecimiento de un familiar?',
    '¿Cuántos días puedo trabajar desde casa por semana?',
    '¿Cuándo pagan el aguinaldo y cómo se calcula?',
    '¿Qué cubre el seguro médico de la empresa?',
    '¿Cómo denuncio un caso de acoso laboral de forma confidencial?'];
  preguntas_dato TEXT[] := ARRAY[
    '¿Cuántos días de vacaciones me quedan?',
    '¿En qué estado está mi solicitud de permiso?',
    '¿Qué día cae mi próximo pago?',
    '¿Cuándo es mi próxima evaluación de desempeño?'];
  temas_dato    TEXT[] := ARRAY['vacaciones', 'solicitudes', 'pagos', 'evaluacion'];
  ids           INT[] := '{}';
  p             INT;
  k             INT;
  r             DOUBLE PRECISION;
  vid           INT;
  m             INT;
  cuenta        INT;
  creada        DATE;
  inicio        DATE;
  tipo_s        TEXT;
  estado_s      TEXT;
  activos       INT[];
  tipos_s       TEXT[] := ARRAY['vacaciones', 'permiso', 'teletrabajo'];
BEGIN
  IF EXISTS (SELECT 1 FROM colaboradores WHERE email LIKE '%@simulado.innovacionescr.com') THEN
    RAISE NOTICE 'Seed 002 ya aplicado; no se repite.';
    RETURN;
  END IF;

  PERFORM setseed(0.42);

  -- ------------------------------------------------------------------------
  -- 1. Colaboradores: Juan (id ids[1]) + 44 generados = 45 nuevos (total 50 con los 5 originales)
  -- ------------------------------------------------------------------------
  INSERT INTO colaboradores (nombre, email, departamento, puesto, fecha_ingreso, rol, estado)
  VALUES ('Juan Pablo Rojas Alvarado', 'juan.rojas@simulado.innovacionescr.com', 'Operaciones',
          'Analista de Operaciones', DATE '2021-03-08', 'colaborador', 'activo')
  RETURNING id INTO vid;
  ids := ids || vid;

  FOR p IN 2..45 LOOP
    INSERT INTO colaboradores (nombre, email, departamento, puesto, fecha_ingreso, rol, estado)
    VALUES (
      nombres[1 + floor(random() * array_length(nombres, 1))::int] || ' ' ||
      apellidos[1 + floor(random() * array_length(apellidos, 1))::int] || ' ' ||
      apellidos[1 + floor(random() * array_length(apellidos, 1))::int],
      'colab' || lpad(p::text, 3, '0') || '@simulado.innovacionescr.com',
      departamentos[1 + floor(random() * array_length(departamentos, 1))::int],
      puestos[1 + floor(random() * array_length(puestos, 1))::int],
      DATE '2018-01-01' + floor(random() * 3100)::int,
      'colaborador',
      'activo')
    RETURNING id INTO vid;
    ids := ids || vid;
  END LOOP;

  -- Escenarios de movimientos y fechas (posiciones fijas dentro de ids)
  -- Ingresos en la ventana de 3 meses
  UPDATE colaboradores SET fecha_ingreso = DATE '2026-09-01' WHERE id = ids[2];
  UPDATE colaboradores SET fecha_ingreso = DATE '2026-10-05' WHERE id = ids[3];
  UPDATE colaboradores SET fecha_ingreso = DATE '2026-11-02' WHERE id = ids[4];
  -- Salidas recientes (colaboradores inactivos)
  UPDATE colaboradores SET estado = 'inactivo' WHERE id IN (ids[5], ids[6]);

  INSERT INTO movimientos_personal (colaborador_id, tipo, fecha, motivo) VALUES
    (ids[2], 'ingreso', DATE '2026-09-01', 'Contratación'),
    (ids[3], 'ingreso', DATE '2026-10-05', 'Contratación'),
    (ids[4], 'ingreso', DATE '2026-11-02', 'Contratación'),
    (ids[5], 'salida',  DATE '2026-10-28', 'Renuncia voluntaria'),
    (ids[6], 'salida',  DATE '2026-11-10', 'Fin de contrato por proyecto'),
    (ids[7], 'ascenso', DATE '2026-08-25', 'Promoción por desempeño'),
    (ids[8], 'ascenso', DATE '2026-09-30', 'Promoción por desempeño'),
    (ids[9], 'ascenso', DATE '2026-10-15', 'Promoción por desempeño');

  -- ------------------------------------------------------------------------
  -- 2. Saldos de vacaciones 2026 (algunos con más de 20 días disponibles)
  -- ------------------------------------------------------------------------
  FOR p IN 1..array_length(ids, 1) LOOP
    IF p IN (5, 6) THEN CONTINUE; END IF;  -- inactivos
    INSERT INTO saldos_vacaciones (colaborador_id, periodo, dias_asignados, dias_tomados)
    VALUES (
      ids[p], '2026',
      CASE WHEN p % 8 = 0 THEN 30 ELSE 15 END,
      CASE WHEN p % 8 = 0 THEN 2 ELSE floor(random() * 8)::int END);
  END LOOP;

  -- ------------------------------------------------------------------------
  -- 3. Solicitudes históricas (17 ago a 17 nov 2026)
  -- ------------------------------------------------------------------------
  FOR p IN 1..array_length(ids, 1) LOOP
    IF p IN (5, 6) THEN CONTINUE; END IF;
    FOR k IN 1..(1 + floor(random() * 2)::int) LOOP
      creada := hoy - floor(random() * 90)::int;
      inicio := creada + 5 + floor(random() * 20)::int;
      tipo_s := tipos_s[1 + floor(random() * 3)::int];
      r := random();
      estado_s := CASE WHEN r < 0.6 THEN 'aprobada' WHEN r < 0.85 THEN 'rechazada' ELSE 'pendiente' END;
      INSERT INTO solicitudes (colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en)
      VALUES (ids[p], tipo_s::tipo_solicitud, inicio, inicio + floor(random() * 4)::int,
              estado_s::estado_solicitud, 4, creada::timestamp AT TIME ZONE 'America/Costa_Rica');
    END LOOP;
  END LOOP;

  -- Pendientes con más de 3 días sin respuesta
  FOR p IN 1..array_length(ids, 1) LOOP
    IF p IN (5, 6) OR p % 5 <> 0 THEN CONTINUE; END IF;
    INSERT INTO solicitudes (colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en)
    VALUES (ids[p], 'vacaciones', hoy + 7, hoy + 9, 'pendiente', 4,
            (hoy - (4 + floor(random() * 12)::int))::timestamp AT TIME ZONE 'America/Costa_Rica');
  END LOOP;

  -- ------------------------------------------------------------------------
  -- 4. Ausencias de hoy (17 nov): vacaciones, permisos y licencia aprobados
  -- ------------------------------------------------------------------------
  FOR p IN 10..13 LOOP
    INSERT INTO solicitudes (colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en)
    VALUES (ids[p], 'vacaciones', DATE '2026-11-14', DATE '2026-11-20', 'aprobada', 4,
            TIMESTAMP '2026-10-28 09:00' AT TIME ZONE 'America/Costa_Rica');
  END LOOP;
  FOR p IN 14..15 LOOP
    INSERT INTO solicitudes (colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en)
    VALUES (ids[p], 'permiso', hoy, hoy, 'aprobada', 4,
            TIMESTAMP '2026-11-10 09:00' AT TIME ZONE 'America/Costa_Rica');
  END LOOP;
  INSERT INTO solicitudes (colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en)
  VALUES (ids[16], 'licencia', DATE '2026-11-16', DATE '2026-11-18', 'aprobada', 4,
          TIMESTAMP '2026-11-05 09:00' AT TIME ZONE 'America/Costa_Rica');

  -- ------------------------------------------------------------------------
  -- 5. Incapacidades (activas hoy y acumuladas en el mes)
  -- ------------------------------------------------------------------------
  FOR p IN 10..13 LOOP
    INSERT INTO incapacidades (colaborador_id, tipo, fecha_inicio, dias, entidad)
    VALUES (ids[p], 'enfermedad', DATE '2026-11-15', 5, 'CCSS');
  END LOOP;
  INSERT INTO incapacidades (colaborador_id, tipo, fecha_inicio, dias, entidad) VALUES
    (ids[20], 'enfermedad',      DATE '2026-10-02', 3, 'CCSS'),
    (ids[21], 'riesgo_laboral',  DATE '2026-11-03', 2, 'INS');
  FOR p IN 22..30 LOOP
    INSERT INTO incapacidades (colaborador_id, tipo, fecha_inicio, dias, entidad)
    VALUES (ids[p], 'enfermedad', hoy - floor(random() * 90)::int, 1 + floor(random() * 4)::int, 'CCSS');
  END LOOP;

  -- ------------------------------------------------------------------------
  -- 6. Evaluaciones de desempeño (Juan tiene una para la pregunta 17)
  -- ------------------------------------------------------------------------
  INSERT INTO evaluaciones_desempeno (colaborador_id, fecha_programada, estado)
  VALUES (ids[1], DATE '2026-12-04', 'programada');
  FOR p IN 2..21 LOOP
    IF p % 2 = 0 THEN
      INSERT INTO evaluaciones_desempeno (colaborador_id, fecha_programada, estado)
      VALUES (ids[p], DATE '2026-12-01' + floor(random() * 45)::int, 'programada');
    END IF;
  END LOOP;

  -- ------------------------------------------------------------------------
  -- 7. Calendario de pagos (planilla quincenal y aguinaldo)
  -- ------------------------------------------------------------------------
  FOR m IN 8..12 LOOP
    INSERT INTO calendario_pagos (fecha_pago, tipo, descripcion) VALUES
      (make_date(2026, m, 15), 'planilla_quincenal', 'Pago de planilla (quincena)'),
      ((date_trunc('month', make_date(2026, m, 1)) + interval '1 month - 1 day')::date,
       'planilla_quincenal', 'Pago de planilla (quincena)')
    ON CONFLICT (fecha_pago) DO NOTHING;
  END LOOP;
  INSERT INTO calendario_pagos (fecha_pago, tipo, descripcion)
  VALUES (DATE '2026-12-15', 'aguinaldo', 'Pago del aguinaldo (décimo tercer mes)')
  ON CONFLICT (fecha_pago) DO NOTHING;

  -- ------------------------------------------------------------------------
  -- 8. Consultas de chat simuladas (250, últimos 30 días)
  -- ------------------------------------------------------------------------
  SELECT array_agg(id) INTO activos FROM colaboradores
   WHERE email LIKE '%@simulado.innovacionescr.com' AND estado = 'activo';
  activos := activos || ARRAY[2, 3];

  FOR k IN 1..250 LOOP
    vid := activos[1 + floor(random() * array_length(activos, 1))::int];
    r := random();
    IF r < 0.45 THEN
      -- política: el RAG aún no está implementado, no queda resuelta
      INSERT INTO consultas_chat (colaborador_id, pregunta, intencion, agente, resuelta, escalada, latencia_ms, fecha, tema, origen)
      VALUES (vid, preguntas_politica[1 + floor(random() * array_length(preguntas_politica, 1))::int],
              'politica', 'politicas', FALSE, FALSE, 900 + floor(random() * 2400)::int,
              ((hoy - floor(random() * 30)::int) + floor(random() * 720)::int * interval '1 minute') AT TIME ZONE 'America/Costa_Rica',
              temas_politica[1 + floor(random() * array_length(temas_politica, 1))::int], 'seed');
    ELSIF r < 0.72 THEN
      cuenta := 1 + floor(random() * array_length(preguntas_dato, 1))::int;
      INSERT INTO consultas_chat (colaborador_id, pregunta, intencion, agente, resuelta, escalada, latencia_ms, fecha, tema, origen)
      VALUES (vid, preguntas_dato[cuenta], 'dato_personal', 'datos', TRUE, FALSE, 300 + floor(random() * 900)::int,
              ((hoy - floor(random() * 30)::int) + floor(random() * 720)::int * interval '1 minute') AT TIME ZONE 'America/Costa_Rica',
              temas_dato[cuenta], 'seed');
    ELSIF r < 0.80 THEN
      INSERT INTO consultas_chat (colaborador_id, pregunta, intencion, agente, resuelta, escalada, latencia_ms, fecha, tema, origen)
      VALUES (vid, '¿Cuántos días me quedan y puedo pasar los que sobren al otro año?', 'mixta', 'politicas_datos',
              FALSE, FALSE, 1500 + floor(random() * 1500)::int,
              ((hoy - floor(random() * 30)::int) + floor(random() * 720)::int * interval '1 minute') AT TIME ZONE 'America/Costa_Rica',
              'vacaciones', 'seed');
    ELSIF r < 0.92 THEN
      INSERT INTO consultas_chat (colaborador_id, pregunta, intencion, agente, resuelta, escalada, latencia_ms, fecha, tema, origen)
      VALUES (vid, '¿Cuál es el salario del gerente general?', 'restringida', 'ninguno', TRUE, FALSE, 1 + floor(random() * 30)::int,
              ((hoy - floor(random() * 30)::int) + floor(random() * 720)::int * interval '1 minute') AT TIME ZONE 'America/Costa_Rica',
              'seguridad', 'seed');
    ELSE
      INSERT INTO consultas_chat (colaborador_id, pregunta, intencion, agente, resuelta, escalada, latencia_ms, fecha, tema, origen)
      VALUES (vid, '¿Me recomiendas una película?', 'fuera_de_alcance', 'ninguno', TRUE, FALSE, 1 + floor(random() * 30)::int,
              ((hoy - floor(random() * 30)::int) + floor(random() * 720)::int * interval '1 minute') AT TIME ZONE 'America/Costa_Rica',
              'fuera_de_alcance', 'seed');
    END IF;
  END LOOP;

  RAISE NOTICE 'Seed 002 aplicado: % colaboradores nuevos.', array_length(ids, 1);
END
$seed$;
