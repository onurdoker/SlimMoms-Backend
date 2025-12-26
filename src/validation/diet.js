import Joi from 'joi';

export const dietSchema = Joi.object({
  height: Joi.number().positive().required(),
  age: Joi.number().integer().min(1).max(120).required(),
  currentWeight: Joi.number().positive().required(),
  desiredWeight: Joi.number().positive().required(),
  bloodType: Joi.number().integer().min(1).max(4).required(),
});

