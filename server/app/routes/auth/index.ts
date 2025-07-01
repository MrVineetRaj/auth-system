import type { Request, Response } from 'express';

import express from 'express';
import type { Router } from 'express';
import { Controller } from './controller';
import { AsyncHandler } from '../../lib/api.helper';
import { validateZodSchema } from '../../middlewares/validator.middleware';
import {
  passwordChangeSchema,
  userLoginSchema,
  userSignUpSchema,
} from '../../validators/auth.validator';
import { authenticateUser } from '../../middlewares/auth.middleware';
export function register(): Router {
  const router: Router = express.Router();
  const controller = new Controller();

  router.post(
    '/register',
    validateZodSchema(userSignUpSchema),
    AsyncHandler(controller.register.bind(controller))
  );

  router.get(
    '/verify-email/:token',
    AsyncHandler(controller.verifyEmail.bind(controller))
  );

  router.post(
    '/login',
    validateZodSchema(userLoginSchema),
    AsyncHandler(controller.login.bind(controller))
  );

  router.get(
    '/profile',
    authenticateUser,
    AsyncHandler(controller.getProfile.bind(controller))
  );

  router.delete(
    '/logout',
    authenticateUser,
    AsyncHandler(controller.logout.bind(controller))
  );
  router.delete(
    '/logout-all',
    authenticateUser,
    AsyncHandler(controller.logoutAll.bind(controller))
  );

  router.post(
    '/reset-password-request',
    AsyncHandler(controller.resetPasswordRequest.bind(controller))
  );
  router.post(
    '/reset-password/:token',
    validateZodSchema(passwordChangeSchema),
    AsyncHandler(controller.changePassword.bind(controller))
  );

  return router;
}
