/**
 * CORS: solo acepta los orígenes listados en CORS_ORIGINS (frontend de React).
 */
import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin(origen, callback) {
    // Sin cabecera Origin (curl, herramientas de servidor) no hay origen de navegador que proteger.
    const permitido = !origen || env.corsOrigins.includes(origen);
    callback(null, permitido);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-User-Id', 'Authorization'],
  exposedHeaders: ['X-Latencia-Ms'],
});
