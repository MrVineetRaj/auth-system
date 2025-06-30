import type { Request, Response } from 'express';

import express from 'express';
import type { Router } from 'express';
import { Controller } from './controller';
import { AsyncHandler } from '../../lib/api.helper';
import { validateZodSchema } from '../../middlewares/validator.middleware';
import { userSignUpSchema } from '../../validators/auth.validator';
export function register(): Router {
  const router: Router = express.Router();
  const controller = new Controller();

  router.post(
    '/register',
    validateZodSchema(userSignUpSchema),
    AsyncHandler(controller.register.bind(controller))
  );

  return router;
}
