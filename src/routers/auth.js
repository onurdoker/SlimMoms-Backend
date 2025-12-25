import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateBody } from '../middlewares/validateBody.js';
import { registerSchema, loginSchema } from '../validation/auth.js';

const router = Router();

router.post(
  '/register',
  validateBody(registerSchema),
  authController.registerUser,
);

router.post('/login', validateBody(loginSchema), authController.loginUser);
router.post('/refresh', authController.refreshTokens);
router.post('/logout', authController.logoutUser);
router.get('/daily', authController.getDailyData);

export default router;
