import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import envConf from '../../envConf';

export const generateRandomToken = (length: number): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateJWTCookie = (userid: string) => {
  const token = jwt.sign({ _id: userid }, envConf.JWT_SECRET, {
    expiresIn: envConf.COOKIE_EXPIRY,
  } as jwt.SignOptions);

  return token;
};

export const comparePassword = (password: string, hashedPassword: string) => {
  const isMatched = bcrypt.compareSync(password, hashedPassword);

  return isMatched;
};
