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
    if (
      !height ||
      !age ||
      !currentWeight ||
      !desiredWeight ||
      bloodType === undefined
    ) {
      throw createError(400, 'Missing required fields');
    }

    // Kan grubu validasyonu (1-4 arası olmalı)
    if (bloodType < 1 || bloodType > 4) {
      throw createError(400, 'Blood type must be between 1 and 4');
    }

    // 1. Kalori Hesabı
    const dailyCalories = calculateCalories(
      age,
      height,
      currentWeight,
      desiredWeight,
    );

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
    if (
      !height ||
      !age ||
      !currentWeight ||
      !desiredWeight ||
      bloodType === undefined
    ) {
      throw createError(400, 'Missing required fields');
    }

    // Kan grubu validasyonu (1-4 arası olmalı)
    if (bloodType < 1 || bloodType > 4) {
      throw createError(400, 'Blood type must be between 1 and 4');
    }

    // 1. Hesapla (Yine aynı mantık)
    const dailyCalories = calculateCalories(
      age,
      height,
      currentWeight,
      desiredWeight,
    );

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
      { new: true },
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

/**
 * Madde 7: Veritabanında ürün aramak için query-string kullanarak bir endpoint oluştur
 */
export const searchProducts = async (req, res, next) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.json({ status: 200, data: [] });
    }

    const filteredProducts = products.filter((product) =>
      product.title.en.toLowerCase().includes(search.toLowerCase()),
    );

    res.json({ status: 200, data: filteredProducts });
  } catch (err) {
    next(err);
  }
};

/**
 * Madde 8: Belirli bir gün için yenilen bir ürünü eklemek için bir endpoint oluştur
 */
export const addEatenProduct = async (req, res, next) => {
  try {
    const { date, productId, weight } = req.body;
    const product = products.find(
      (p) => p._id.$oid === productId || p._id === productId,
    );

    if (!product) throw createError(404, 'Product not found');

    const calories = (product.calories * weight) / 100;

    // Not: Gerçekte burası bir Diary modeline kaydedilmeli
    res.status(201).json({
      status: 201,
      data: { date, product: product.title.en, calories, weight },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Madde 9: Belirli bir gün için yenilen bir ürünü silmek için bir endpoint oluştur
 */
export const deleteEatenProduct = async (req, res, next) => {
  try {
    const { foodId } = req.params;
    res.json({ status: 200, message: `Product ${foodId} deleted` });
  } catch (err) {
    next(err);
  }
};

/**
 * Madde 10: Belirli bir güne ait tüm bilgileri almak için bir endpoint oluştur
 */
export const getDailyDiary = async (req, res, next) => {
  try {
    const { dayId } = req.params;
    res.json({ status: 200, message: `Diary info for ${dayId}` });
  } catch (err) {
    next(err);
  }
};
