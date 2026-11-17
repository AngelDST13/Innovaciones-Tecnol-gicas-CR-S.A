/**
 * Rutas del chat. Sin lógica: cada endpoint invoca un método del controller.
 * Todas exigen autenticación; cualquier rol (colaborador o rrhh) puede usar el chat.
 */
import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/auth.js';
import * as chatController from '../controllers/chatController.js';

const router = Router();

router.use(requiereAutenticacion);
router.post('/mensajes', chatController.enviarMensaje);
router.get('/historial', chatController.historial);

export default router;
