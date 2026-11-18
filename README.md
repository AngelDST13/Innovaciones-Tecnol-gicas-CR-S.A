# Innovaciones Tecnológicas CR S.A. · Portal de consulta de políticas de RRHH

Portal interno para que los colaboradores consulten políticas de RRHH en lenguaje natural, y para que RRHH
vea un dashboard ejecutivo con indicadores y un reporte diario. Proyecto del **Mini Proyecto #2**
(ver `docs/mini-proyecto-2-spec.pdf`). Todos los datos son **simulados**.

| Capa | Tecnología |
| --- | --- |
| Backend | Node.js 20+ · Express 5 · controllers, services, agents, middlewares |
| Base de datos | Supabase (PostgreSQL 17) con `pg` · extensión `vector` activa |
| IA | DeepSeek vía SDK de OpenAI (`base_url` de DeepSeek) |
| Frontend | React 18 · Vite · Tailwind CSS · Recharts |
| Pruebas | Jest · Supertest (65 pruebas) |

---

## 1. Estado del proyecto

Esta tabla es la fuente de verdad. Lo que no esté marcado como **Hecho** no funciona todavía.

| Requisito del spec | Estado |
| --- | --- |
| Tablas mínimas (colaboradores, saldos, solicitudes, incapacidades, movimientos, consultas, reportes) | ✅ Hecho |
| Roles colaborador y rrhh, datos 100 % simulados | ✅ Hecho |
| RLS activado en todas las tablas | ✅ Hecho |
| Volumen: 50 colaboradores, ~3 meses de movimientos, 250 consultas simuladas | ✅ Hecho (`seeds/002`) |
| Escenarios del reporte (ausentes, pendientes >3 días, incapacidades, rotación, >20 días, Juan) | ✅ Hecho |
| Filtro determinista de preguntas restringidas (21 y 22) | ✅ Hecho y verificado en vivo |
| Orquestador con clasificación por DeepSeek y falla cerrada | ✅ Hecho |
| Reporte diario con 8 elementos, cifras por SQL y resumen verificado | ✅ Hecho |
| Reporte automático a las 7:00 a. m. (hora de Costa Rica) | ✅ Hecho: temporizador del proceso, reporte al arrancar si falta, `POST /api/v1/reportes/automatico` (token `X-Token-Cron`) y `npm run reporte:diario` para un programador externo |
| Dashboard con KPIs, tendencia 30 días, 2 gráficos, pendientes, resumen e historial | ✅ Hecho |
| Chat con respuestas, intención y latencia | ✅ Hecho |
| Login con roles, CORS, latencia (`X-Latencia-Ms`), errores sin filtrar detalles | ✅ Hecho |
| Agente de **políticas (RAG)**: responder solo con fragmentos de Drive y citar documento y punto | ✅ Hecho: 147 fragmentos indexados; búsqueda con reformulación de la pregunta; umbral de similitud 0.873 (calibrado) |
| Documentos de políticas (≥10) en Drive | ✅ Hecho: 11 archivos verificados (`npm run drive:verify`); investigación en `docs/investigacion-rrhh.md` |
| Sincronización con Drive: nuevos, editados y borrados | ✅ Hecho: `changes.list` desde el `pageToken` de `sync_drive_estado` (`npm run rag:ingesta`); sincronización completa solo la primera vez o si el token vence |
| Embeddings y fragmentos en pgvector | ✅ Hecho: `multilingual-e5-small` (384 dim.), migración 003, índice HNSW |
| Pagos (pregunta 9) y evaluaciones (pregunta 17) respondidas por sus agentes | ✅ Hecho: agentes de pagos y de desempeño |
| Feriados (pregunta 20) y conteo de ausencias para RRHH (pregunta 25) | ✅ Hecho: feriados desde el calendario oficial; conteo solo para el rol rrhh |
| Usuario de solo lectura para el agente de datos (`agente_lectura`) | ✅ Hecho: solo `SELECT`, sujeto a RLS; la contraseña se generó y se guardó solo en `backend/.env` |
| Agente de escalamiento con tickets (punto extra) | ✅ Hecho: tickets en `tickets_escalamiento` cuando la política no está en los documentos |
| Banco de 45 preguntas evaluado y resultados | ✅ Ejecutado: 38 a 39 de 45 aciertos (84–87 %) según la corrida; detalle en `docs/hoja-evaluacion.md` |
| Informe técnico 8–12 páginas, diagrama, video de demo | ⚠️ Borrador (`docs/informe-tecnico.md`); diagrama y video pendientes |

**Lo que falta** está en la sección 7: seis preguntas del banco todavía fallan (3, 26, 31, 34, 43 y 45) y el umbral sube un poco la exigencia para el RAG.

---

## 2. Estructura del repositorio

```text
backend/
  src/
    app.js              Express: middlewares y rutas (sin escuchar puertos; lo usan las pruebas)
    server.js           Arranque del servidor y del programador del reporte diario
    config/             env, database (pg), deepseek
    middlewares/        cors, latencia, auth (roles), errorHandler
    routes/             solo declaran endpoints y middlewares
    controllers/        HTTP: validan la entrada y llaman a services / agents / jobs
    services/           acceso a datos (SQL parametrizado, filtrado por el id autenticado)
    agents/             orquestador, guardrails, agente de datos, agente de políticas (RAG), analista
    jobs/               generación del reporte y programador de las 7:00 a. m.
  tests/                Jest + Supertest (unitarias e integración)
  .env.example          Variables requeridas (copiar a .env; nunca subir .env)
frontend/
  src/
    App.jsx             Rutas, disposición y protección por rol
    pages/              HomePage, LoginPage, ChatPage, DashboardPage, LegalPage
    components/         Logo, Navbar, Sidebar, ChatBox, KpiCards, Reveal, Modal, ThemeToggle, CookieBanner, Footer...
    context/            AuthContext, ThemeContext (día/noche), CookieContext
    services/api.js     Cliente HTTP único hacia el backend
    content/legal.js    Textos legales (borrador, pendiente de revisión legal)
database/
  schema.sql            Esquema base. ⚠️ BORRA y recrea las tablas: ejecutar solo en una base vacía
  migrations/002_*.sql  Migración aditiva: campos y tablas nuevas (segura de repetir)
  seeds/002_*.sql       Datos simulados de volumen (idempotente)
docs/
  mini-proyecto-2-spec.pdf   Enunciado oficial
  informe-tecnico.md         Informe técnico (borrador v0.9, con pendientes marcados)
  investigacion-rrhh.md      Fase 1: investigación de RRHH y marco normativo de Costa Rica
  hoja-evaluacion.md         Banco de 45 preguntas con respuesta esperada y resultado
  diagrama-arquitectura.md   Diagramas: componentes, flujo de consulta, reporte diario y modelo de datos
  politicas/                 10 documentos de política (uno por dominio) + calendario-2026.csv
  prompts/                   Prompts de cada agente, versionados
README.md
```

---

## 3. Puesta en marcha

Requisitos: **Node.js 20+** y una cuenta de Supabase con un proyecto creado.

### 3.1 Base de datos (Supabase)

El repositorio no contiene código que ejecute SQL. Las tablas se crean y cambian con los archivos de `database/`, pegados en el **SQL Editor** de Supabase y ejecutados en orden.

1. En el panel del proyecto: **Settings → API Keys**. Copia la URL del proyecto y la clave `service_role`.
2. Crea `backend/.env` a partir de `backend/.env.example`:
   - `SUPABASE_URL`: la URL del proyecto.
   - `SUPABASE_SERVICE_ROLE_KEY`: la clave `service_role`. Solo va en `backend/.env`, nunca en el repositorio.
   - `GOOGLE_APPLICATION_CREDENTIALS`, `DRIVE_FOLDER_ID` y `DEEPSEEK_API_KEY` según `.env.example`.
3. Ejecuta los archivos de `database/` en el SQL Editor, en este orden. Cada uno es idempotente salvo el primero:
   - `schema.sql`: **borra y recrea** las tablas. Solo en una base vacía.
   - `migrations/002_volumen_y_campos.sql` y `seeds/002_datos_simulados.sql`.
   - `migrations/003_rag_fragmentos.sql`.
   - `migrations/004_rpc_busqueda_politicas.sql`.
   - `migrations/005_tickets_escalamiento.sql`.
   - `security/rol_solo_lectura.sql`: **no se usa** con la arquitectura actual. Se conserva como referencia.
4. Verifica que los datos quedaron cargados:

   ```sql
   SELECT
     (SELECT COUNT(*) FROM colaboradores) AS colaboradores,
     (SELECT COUNT(*) FROM solicitudes)   AS solicitudes,
     (SELECT COUNT(*) FROM calendario_pagos) AS pagos;
   ```

El seed 002 se salta solo si ya existen colaboradores con el dominio `@simulado.innovacionescr.com`.

Para cargar los fragmentos de las políticas desde Drive, después de la migración 003: `npm run rag:ingesta` (desde `backend/`).

### 3.2 Backend

```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env   (completar valores)
npm install
npm run start                 # http://localhost:8000
```

Comprobación rápida:

```bash
curl http://localhost:8000/health
# {"status":"ok","database":"supabase-postgresql"}
```

Variables principales (ver `.env.example`):

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | Sí | Clave de la API de DeepSeek |
| `PORT` | No | Puerto del backend (8000 por defecto) |
| `CORS_ORIGINS` | No | Orígenes del frontend, separados por coma |
| `REPORTE_AUTOMATICO` | No | `false` desactiva el reporte de las 7:00 a. m. |
| `REPORTE_CRON_TOKEN` | No | Token para `POST /api/v1/reportes/automatico` (cabecera `X-Token-Cron`). Sin él, la ruta no existe |

Pruebas:

```bash
npm test                      # 98 pruebas: unitarias e integración, sin base real ni red
```

### 3.3 Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
npm run build                 # compilación de producción
```

`VITE_API_URL` apunta al backend (por defecto `http://localhost:8000`).

### 3.4 Usuarios de prueba

| Correo | Rol | Qué ve |
| --- | --- | --- |
| `ana.gutierrez@innovacionescr.com` | rrhh | Dashboard ejecutivo y chat |
| `carlos.mora@innovacionescr.com` | colaborador | Chat y su perfil |
| `juan.rojas@simulado.innovacionescr.com` | colaborador | Chat (pregunta 21: sus datos no se comparten) |

El inicio de sesión de desarrollo usa solo el correo, sin contraseña. Ver la sección 6.

---

## 4. Endpoints

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | público | Estado del servicio y de la base |
| POST | `/api/v1/auth/login` | público | `{ email }` → usuario y rol. 404 si no existe |
| GET | `/api/v1/auth/sesion` | cualquiera | Usuario actual |
| POST | `/api/v1/chat/mensajes` | cualquiera | `{ pregunta }` → respuesta, intención, citas, latencia |
| GET | `/api/v1/chat/historial` | cualquiera | Consultas propias |
| GET | `/api/v1/empleados/mi-perfil` | cualquiera | Perfil y saldos propios |
| GET | `/api/v1/empleados` | rrhh | Listado de colaboradores |
| GET | `/api/v1/dashboard/resumen` | rrhh | KPIs, tendencia de 30 días, solicitudes pendientes |
| GET | `/api/v1/reportes` | rrhh | Historial de reportes diarios |
| POST | `/api/v1/reportes/generar` | rrhh | Genera el reporte de hoy, o el de `{ fecha }` |

Las rutas autenticadas reciben la cabecera `X-User-Id: <id>`. Todas las respuestas incluyen `X-Latencia-Ms`.

Códigos de error: `400` datos inválidos · `401` falta identidad · `403` rol no autorizado · `404` recurso no encontrado · `413` cuerpo demasiado grande · `503` base de datos o IA no disponibles · `500` error interno (sin detalles).

---

## 5. Seguridad y privacidad

- **Filtro determinista antes del modelo** (`backend/src/agents/guardrails.js`): bloquea salarios de gerencia, datos de compañeros (pregunta 21), datos de terceros (pregunta 22), credenciales e intentos de cambiar las instrucciones del asistente.
- **Falla cerrada:** si DeepSeek devuelve una salida que no es JSON válido, la consulta se trata como fuera de alcance y no se ejecuta ningún agente.
- **Datos por usuario:** el agente de datos usa consultas fijas y parametrizadas, filtradas por el id autenticado. El modelo nunca genera SQL.
- **Reporte verificado:** las cifras salen de SQL. El resumen del analista se descarta si contiene una cifra que no esté en las métricas, y entonces se usa una plantilla.
- **CORS** con lista blanca, límite de 10 KB en el cuerpo, y errores que no revelan detalles internos.
- **Secretos:** `.env` está excluido de Git. Ninguna clave va en el código.
- **RLS** activado en Supabase. El backend se conecta con el rol `postgres`, que lo omite; por eso el backend debe ser el único punto de acceso.

**Limitaciones conocidas (aceptables para desarrollo, no para producción):**

- Inicio de sesión sin contraseña, identificado con el correo, y cabecera `X-User-Id` sin firma. Cualquiera puede suplantar un id. Antes de producción: JWT o SSO.
- El correo inexistente responde 404, lo que revela qué correos están registrados.
- El backend usa el rol `postgres`. Lo correcto es un rol de solo lectura para el agente de datos.
- El reporte automático corre solo mientras el proceso del backend está encendido.

---

## 6. Decisiones de diseño

- **Un solo almacén relacional** (Supabase) para personas, solicitudes, logs y reportes; la base vectorial convivirá en la misma instancia con pgvector, como sugiere el spec.
- **Capas estrictas:** las rutas solo declaran endpoints; los controllers validan y coordinan; los services hacen SQL; los agents razonan. Las pruebas de integración verifican que cada rol obtenga solo lo que le corresponde.
- **Métricas antes que texto:** el reporte se calcula en SQL. El LLM solo redacta, y su salida se verifica.
- **Tema visual con tokens semánticos:** modo noche y modo día comparten componentes; la preferencia se guarda en `localStorage`.
- **Cookies y legal:** el banner recuerda la decisión y puede reabrirse desde el pie. Los textos legales son un **borrador** basado en la Ley 8968 (Costa Rica) y requieren revisión del área legal.

---

## 7. Pendientes, en orden de prioridad

1. **Recuperación del RAG:** las preguntas 3, 26, 31, 34, 43 y 45 del banco siguen fallando. En 3, 26, 31 y 34 el fragmento correcto queda por debajo del umbral 0.873 o fuera de los primeros candidatos (recuperación). En 45 el fragmento no entra al top 4. En 43 el fragmento correcto sí llega, pero la respuesta omite el plazo (generación). Requiere revisar el umbral con un banco de calibración más grande.
2. **Estabilidad de la evaluación:** la corrida del banco no es idéntica entre ejecuciones (preguntas 19 y 30 cambiaron). Conviene fijar la respuesta esperada con datos más precisos.
3. **Índice HNSW:** verificarlo en el SQL Editor (`SELECT indexname FROM pg_indexes WHERE tablename = 'fragmentos_politica';`).
4. **Autenticación real** (JWT) antes de cualquier despliegue fuera del entorno de desarrollo.
5. **Rotación de claves:** la clave de DeepSeek y la clave service_role de Supabase aparecieron en la conversación de trabajo; se recomienda rotarlas.
