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
| Reporte automático a las 7:00 a. m. (hora de Costa Rica) | ✅ Hecho (mientras el backend esté encendido) |
| Dashboard con KPIs, tendencia 30 días, 2 gráficos, pendientes, resumen e historial | ✅ Hecho |
| Chat con respuestas, intención y latencia | ✅ Hecho |
| Login con roles, CORS, latencia (`X-Latencia-Ms`), errores sin filtrar detalles | ✅ Hecho |
| Agente de **políticas (RAG)**: responder solo con fragmentos de Drive y citar documento y punto | ✅ Hecho: 147 fragmentos indexados; umbral de similitud 0.84 (provisional) |
| Documentos de políticas (≥10) en Drive | ✅ Hecho: 11 archivos verificados (`npm run drive:verify`); investigación en `docs/investigacion-rrhh.md` |
| Sincronización con Drive: nuevos, editados y borrados | ✅ Hecho: incremental por `modifiedTime` (`npm run rag:ingesta`); `changes.list` pendiente de usar |
| Embeddings y fragmentos en pgvector | ✅ Hecho: `multilingual-e5-small` (384 dim.), migración 003, índice HNSW |
| Pagos (pregunta 9) y evaluaciones (pregunta 17) respondidas por el agente de datos | ⚠️ Datos cargados; el agente aún no los consulta |
| Usuario de solo lectura para el agente de datos (`agente_lectura`) | ✅ Hecho: solo `SELECT`, sujeto a RLS; la contraseña se generó y se guardó solo en `backend/.env` |
| Agente de escalamiento con tickets (punto extra) | ❌ Pendiente |
| Banco de 45 preguntas evaluado y resultados | ❌ Pendiente (ver `docs/hoja-evaluacion.md`) |
| Informe técnico 8–12 páginas, diagrama, video de demo | ⚠️ Borrador (`docs/informe-tecnico.md`); diagrama y video pendientes |

**Lo más importante que falta** es calibrar el RAG con el banco de 45 preguntas y completar la hoja de evaluación; el umbral de similitud es provisional.

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
  scripts/aplicar-sql.js  Aplica archivos SQL a la base de DATABASE_URL
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

1. En el panel del proyecto: **Connect → Transaction pooler**. Copia el host, el usuario y el puerto `6543`.
2. Crea `backend/.env` a partir de `backend/.env.example` y completa `DATABASE_URL`.
   - La contraseña **debe ir codificada** en la URL: `&` → `%26`, `$` → `%24`, `/` → `%2F`, `@` → `%40`.
   - El usuario tiene la forma `postgres.<ID_DEL_PROYECTO>`.
3. Aplica el esquema **solo si la base está vacía**. Este paso borra tablas existentes:
   - SQL Editor de Supabase → pegar `database/schema.sql` → **Run**.
   - Alternativa desde `backend/`: `node scripts/aplicar-sql.js ../database/schema.sql`
4. Aplica la migración y el volumen de datos (ambos seguros de repetir):

   ```bash
   cd backend
   node scripts/aplicar-sql.js ../database/migrations/002_volumen_y_campos.sql ../database/seeds/002_datos_simulados.sql
   ```

   El seed se salta solo si ya existen colaboradores con el dominio `@simulado.innovacionescr.com`.

5. Crea el rol de solo lectura del agente de datos. El script genera la contraseña, la guarda en `backend/.env` como `DATABASE_URL_LECTURA` y verifica que el rol puede leer pero no escribir. La contraseña no se muestra en pantalla.

   ```bash
   cd backend
   node scripts/crear-rol-lectura.js
   ```

   Volver a ejecutarlo rota la contraseña del rol.

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
| `DATABASE_URL` | Sí | Cadena de conexión de Supabase (pooler, puerto 6543) |
| `DEEPSEEK_API_KEY` | Sí | Clave de la API de DeepSeek |
| `PORT` | No | Puerto del backend (8000 por defecto) |
| `CORS_ORIGINS` | No | Orígenes del frontend, separados por coma |
| `DATABASE_URL_LECTURA` | Recomendada | Conexión del rol `agente_lectura` (la genera `scripts/crear-rol-lectura.js`) |
| `REPORTE_AUTOMATICO` | No | `false` desactiva el reporte de las 7:00 a. m. |

Pruebas:

```bash
npm test                      # 65 pruebas: unitarias e integración, sin base real ni red
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

1. **Drive + ingesta + RAG:** cuenta de servicio de Google Cloud, carpeta compartida, documentos de política con metadatos (título, versión, vigencia, responsable), fragmentación, embeddings y fragmentos en pgvector, y el agente de políticas con citas.
2. **Sincronización diaria con Drive** usando `changes.list` y el estado guardado en `sync_drive_estado`.
3. **Agente de datos** para pagos (`calendario_pagos`) y evaluaciones (`evaluaciones_desempeno`).
4. **Evaluación:** ejecutar el banco de 45 preguntas y completar `docs/hoja-evaluacion.md`.
5. **Informe técnico final y diagrama de arquitectura.**
6. **Autenticación real** (JWT) antes de cualquier despliegue fuera del entorno de desarrollo.
