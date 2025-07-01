import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import envConf from '../../envConf';
import { ApiResponse } from '../lib/api.helper';
import SessionToken from '../database/models/session-token.model';
import User from '../database/models/user.model';
import { USER_ROLES } from '../lib/constants';

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies[envConf.COOKIE_NAME];

  if (!token) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  const decoded: JwtPayload = jwt.verify(
    token,
    envConf.JWT_SECRET
  ) as JwtPayload;

  const userId = decoded._id;

  if (!userId) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }
  const session = await SessionToken.findOne({
    userId,
    token,
  });

  if (!session || session.isBlackListed) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  const expiryTime = new Date(session.expiresAt).getTime();

  if (expiryTime < Date.now()) {
    session.isBlackListed = true;
    await session.save();

    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  const user = await User.findById(session.userId);

  if (!user) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  req.body = {
    ...req.body,
    user,
    token,
  };

  next();
};

export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies[envConf.COOKIE_NAME];

  if (!token) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  const decoded: JwtPayload = jwt.verify(
    token,
    envConf.JWT_SECRET
  ) as JwtPayload;

  const userId = decoded._id;

  if (!userId) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }
  const session = await SessionToken.findOne({
    userId,
    token,
  });

  if (!session || !session.isBlackListed) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  const expiryTime = new Date(session.expiresAt).getTime();
  if (expiryTime < Date.now()) {
    session.isBlackListed = true;
    await session.save();

    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  const user = await User.findById(session.userId);

  if (!user) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  if (user.role !== USER_ROLES.ADMIN) {
    res.status(401).json(new ApiResponse(401, 'Unauthorized'));
    return;
  }

  req.body = {
    ...req.body,
    user,
    token,
  };

  next();
};
