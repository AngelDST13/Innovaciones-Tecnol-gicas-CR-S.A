/**
 * Cliente de DeepSeek. Usa el SDK oficial de OpenAI apuntando a la base_url de DeepSeek.
 */
import OpenAI from 'openai';
import { env } from './env.js';

export const clienteDeepSeek = new OpenAI({
  apiKey: env.deepseekApiKey,
  baseURL: env.deepseekBaseUrl,
  timeout: env.deepseekTimeoutMs,
  maxRetries: 1,
});

export const modeloDeepSeek = env.deepseekModel;
