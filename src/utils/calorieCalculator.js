/**
 * Kadınlar için günlük kalori ihtiyacını hesaplar
 * Formül: 10 * ağırlık + 6.25 * boy - 5 * yaş - 161 - 10 * (ağırlık - istenen ağırlık)
 * @param {number} age - Yaş
 * @param {number} height - Boy (cm)
 * @param {number} currentWeight - Mevcut ağırlık (kg)
 * @param {number} desiredWeight - İstenen ağırlık (kg)
 * @returns {number} Günlük kalori ihtiyacı
 */
const calculateCalories = (age, height, currentWeight, desiredWeight) => {
  return (
    10 * currentWeight +
    6.25 * height -
    5 * age -
    161 -
    10 * (currentWeight - desiredWeight)
  );
};

export default calculateCalories;

