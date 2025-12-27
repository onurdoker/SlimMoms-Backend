import { isValidObjectId } from 'mongoose';
import createHttpError from 'http-errors';

export const isValidId = (req, res, next) => {
  const id = req.params.id || req.params.foodId || req.params.dayId;

  if (!id || !isValidObjectId(id)) {
    return next(createHttpError(400, `Invalid ID format: ${id}`));
  }

  next();
};
