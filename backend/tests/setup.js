/**
 * Variables de entorno de prueba. Se cargan antes de cada archivo de test.
 * Las pruebas nunca usan credenciales reales: la base de datos y DeepSeek se simulan.
 */
process.env.DEEPSEEK_API_KEY = 'clave-de-prueba';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.LATENCY_WARNING_MS = '3000';
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://simulado.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-simulada';
