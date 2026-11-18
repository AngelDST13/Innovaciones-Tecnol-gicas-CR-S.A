/** Rutas de reportes diarios. Exclusivas de rrhh. Sin lógica: delega en reportesController. */
import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.js';
import * as reportesController from '../controllers/reportesController.js';

const router = Router();

// Ruta de programación: autenticada por token (X-Token-Cron), no por usuario. Va antes del filtro de rol.
router.post('/automatico', reportesController.automatico);

router.use(requiereAutenticacion, requiereRol('rrhh'));
router.get('/', reportesController.historial);
router.post('/generar', reportesController.generar);

export default router;
