/** Rutas de autenticación. Sin lógica: delega en authController. */
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requiereAutenticacion } from '../middlewares/auth.js';

const router = Router();

router.post('/login', authController.login);
router.get('/sesion', requiereAutenticacion, authController.sesion);

export default router;
