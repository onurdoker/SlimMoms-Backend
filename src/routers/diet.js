import { Router } from 'express';
import * as dietController from '../controllers/dietController.js';
import { validateBody } from '../middlewares/validateBody.js';
import { dietSchema } from '../validation/diet.js';
import authenticate from '../middlewares/authenticate.js';
import { isValidId } from '../middlewares/isValidId.js';

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

// Madde 7: Veritabanında ürün aramak için query-string kullanarak bir endpoint oluştur
router.get('/products', authenticate, dietController.searchProducts);

// Madde 8: Belirli bir gün için yenilen bir ürünü eklemek için bir endpoint oluştur
router.post('/diary', authenticate, dietController.addEatenProduct);

// Madde 9: Belirli bir gün için yenilen bir ürünü silmek için bir endpoint oluştur
router.delete(
  '/diary/:foodId',
  authenticate,
  isValidId,
  dietController.deleteEatenProduct,
);

// Madde 10: Belirli bir güne ait tüm bilgileri almak için bir endpoint oluştur
router.get(
  '/diary/:dayId',
  authenticate,
  isValidId,
  dietController.getDailyDiary,
);

export default router;
