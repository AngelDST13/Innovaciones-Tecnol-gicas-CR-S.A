/** Rutas del dashboard de RRHH. Exclusivas del rol `rrhh`. Sin lógica: delega en dashboardController. */
import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.get('/resumen', requiereAutenticacion, requiereRol('rrhh'), dashboardController.resumen);

export default router;
