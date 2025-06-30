import { NextFunction, Request, Response } from 'express';
import { ZodAny, ZodSchema } from 'zod';
import { ApiResponse } from '../lib/api.helper';

export const validateZodSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error('Validation error:', result.error);

      // Create detailed error response with field names
      const fieldErrors: { [key: string]: string } = {};
      result.error.errors.forEach((error) => {
        const fieldName = error.path.join('.');
        fieldErrors[fieldName] = error.message;
      });

      res
        .status(400)
        .json(new ApiResponse(400, 'Validation error', undefined, fieldErrors));
      return;
    }

    req.body = result.data;
    next();
  };
};
