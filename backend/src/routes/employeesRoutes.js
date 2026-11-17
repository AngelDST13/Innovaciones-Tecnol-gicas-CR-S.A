/** Rutas de colaboradores. Sin lógica: delega en employeesController. */
import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.js';
import * as employeesController from '../controllers/employeesController.js';

const router = Router();

router.use(requiereAutenticacion);
router.get('/mi-perfil', employeesController.miPerfil);
router.get('/', requiereRol('rrhh'), employeesController.listar);

export default router;
