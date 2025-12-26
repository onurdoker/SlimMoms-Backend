import { Router } from 'express';
import * as dietController from '../controllers/dietController.js';
import { validateBody } from '../middlewares/validateBody.js';
import { dietSchema } from '../validation/diet.js';
import authenticate from '../middlewares/authenticate.js';

const router = Router();

// Madde 5: Public Endpoint (Auth yok) - Herkese açık kalori hesaplama
router.post('/', validateBody(dietSchema), dietController.getPublicDietAdvice);

// Madde 6: Private Endpoint (Auth var) - Giriş yapmış kullanıcılar için, veritabanına kaydeder
router.post(
  '/users',
  authenticate,
  validateBody(dietSchema),
  dietController.postPrivateDietAdvice,
);

export default router;

