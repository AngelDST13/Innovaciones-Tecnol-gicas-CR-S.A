/**
 * Aplicación Express: middlewares y rutas. No escucha puertos (lo hace server.js),
 * para que Supertest pueda probarla directamente.
 *
 * Orden: CORS -> latencia -> JSON -> rutas -> 404 -> manejador global de errores.
 */
import express from 'express';
import { verificarConexion } from './config/database.js';
import { corsMiddleware } from './middlewares/cors.js';
import { medirLatencia } from './middlewares/latencia.js';
import { manejadorErrores } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import employeesRoutes from './routes/employeesRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(medirLatencia);
app.use(express.json({ limit: '10kb' }));

app.get('/health', async (_req, res) => {
  const conectada = await verificarConexion();
  res.status(conectada ? 200 : 503).json({
    status: conectada ? 'ok' : 'degradado',
    database: 'supabase-postgresql',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/empleados', employeesRoutes);
app.use('/api/v1/reportes', reportesRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(manejadorErrores);
