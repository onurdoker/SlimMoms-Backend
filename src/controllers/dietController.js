import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../db/models/User.js';
import calculateCalories from '../utils/calorieCalculator.js';
import createError from 'http-errors';

// ES6 modules için __dirname benzeri yapı
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON dosyasını bir kere oku ve hafızaya al (module level cache)
const productsPath = path.join(__dirname, '../data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

/**
 * Yasaklı ürünleri filtrele ve kategorilerini döndür
 * @param {number} bloodType - Kan grubu (1-4)
 * @returns {string[]} Yasaklı ürün kategorileri (benzersiz)
 */
const getNotAllowedCategories = (bloodType) => {
  // bloodType: 1, 2, 3 veya 4 geliyor
  // JSON'daki yapı: groupBloodNotAllowed: [null, true, false, false, false]
  // Index 0 null, Index 1 -> 1. Grup. Yani direkt index olarak kullanabiliriz
  
  // 1. Yasaklı olanları filtrele (JavaScript filter metodu)
  const notAllowedProducts = products.filter((product) => {
    return product.groupBloodNotAllowed[bloodType] === true;
  });

  // 2. Sadece kategorileri al ve tekrarlananları temizle (Set kullanarak)
  const allCategories = notAllowedProducts.map((p) => p.categories);
  const uniqueCategories = [...new Set(allCategories)];

  return uniqueCategories;
};

/**
 * Public endpoint - Herkese açık kalori hesaplama
 * Veritabanına kaydetmez, sadece hesaplama yapar
 */
export const getPublicDietAdvice = async (req, res, next) => {
  try {
    const { height, age, currentWeight, desiredWeight, bloodType } = req.body;

    // Validasyon
    if (!height || !age || !currentWeight || !desiredWeight || bloodType === undefined) {
      throw createError(400, 'Missing required fields');
    }

    // Kan grubu validasyonu (1-4 arası olmalı)
    if (bloodType < 1 || bloodType > 4) {
      throw createError(400, 'Blood type must be between 1 and 4');
    }

    // 1. Kalori Hesabı
    const dailyCalories = calculateCalories(age, height, currentWeight, desiredWeight);

    // 2. Ürün filtresi (JSON dosyasından)
    const notAllowedCategories = getNotAllowedCategories(bloodType);

    res.json({
      status: 200,
      data: {
        dailyCalories: Math.round(dailyCalories),
        notAllowedProducts: notAllowedCategories,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Private endpoint - Giriş yapmış kullanıcılar için
 * Hesaplamayı yapar VE sonucu kullanıcının veritabanındaki kaydına işler
 */
export const postPrivateDietAdvice = async (req, res, next) => {
  try {
    const { height, age, currentWeight, desiredWeight, bloodType } = req.body;
    const { _id } = req.user; // Auth middleware'den gelen user id

    // Validasyon
    if (!height || !age || !currentWeight || !desiredWeight || bloodType === undefined) {
      throw createError(400, 'Missing required fields');
    }

    // Kan grubu validasyonu (1-4 arası olmalı)
    if (bloodType < 1 || bloodType > 4) {
      throw createError(400, 'Blood type must be between 1 and 4');
    }

    // 1. Hesapla (Yine aynı mantık)
    const dailyCalories = calculateCalories(age, height, currentWeight, desiredWeight);

    // 2. Ürün filtresi (JSON dosyasından)
    const notAllowedCategories = getNotAllowedCategories(bloodType);

    // 3. KULLANICIYI GÜNCELLE
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        userData: {
          height,
          age,
          currentWeight,
          desiredWeight,
          bloodType,
          dailyRate: Math.round(dailyCalories),
          notAllowedProducts: notAllowedCategories, // Yasaklı listeyi de user'a kaydediyoruz
        },
      },
      { new: true } // Güncellenmiş veriyi döndür
    );

    if (!updatedUser) {
      throw createError(404, 'User not found');
    }

    res.json({
      status: 200,
      data: {
        dailyCalories: Math.round(dailyCalories),
        notAllowedProducts: notAllowedCategories,
      },
    });
  } catch (err) {
    next(err);
  }
};

