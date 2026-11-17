/** Rutas de reportes diarios. Exclusivas de rrhh. Sin lógica: delega en reportesController. */
import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.js';
import * as reportesController from '../controllers/reportesController.js';

const router = Router();

router.use(requiereAutenticacion, requiereRol('rrhh'));
router.get('/', reportesController.historial);
router.post('/generar', reportesController.generar);

export default router;
