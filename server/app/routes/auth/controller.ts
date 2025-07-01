import type { CookieOptions, Request, Response } from 'express';
import geoip from 'geoip-lite';

import User from '../../database/models/user.model';
import { ApiResponse } from '../../lib/api.helper';
import {
  comparePassword,
  generateJWTCookie,
  generateRandomToken,
} from '../../helper/auth';
import { generateVerificationEmail, sendEmail } from '../../lib/mail.conf';
import envConf from '../../../envConf';
import { rmSync } from 'fs';
import SessionToken from '../../database/models/session-token.model';

export class Controller {
  // Add your authentication methods
  public async register(req: Request, res: Response) {
    const { name, email, password } = req.body;

    const isExistingUser = await User.findOne({ email: email.toLowerCase() });

    if (isExistingUser) {
      res.status(400).json(
        new ApiResponse(400, 'User already exists', undefined, {
          email: 'Email is already registered',
        })
      );
      return;
    }

    const emailVerificationToken = generateRandomToken(32);
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password, // Ensure to hash the password in a real application
      emailVerificationToken,
      emailVerificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000), // Token valid for 24 hours
    });

    await sendEmail(
      newUser.email,
      'Verify your email address',
      generateVerificationEmail(
        newUser.name,
        `${envConf.NODE_ENV === 'development' ? envConf.BASE_URL : envConf.FRONTEND_URL}/auth/verify-email/${emailVerificationToken}`
      ).emailBody,
      generateVerificationEmail(
        newUser.name,
        `${envConf.NODE_ENV === 'development' ? envConf.BASE_URL : envConf.FRONTEND_URL}/auth/verify-email/${emailVerificationToken}`
      ).emailText
    );

    await newUser.save();

    const userId = newUser._id;
    const cookie = generateJWTCookie(String(userId));

    const userAgent = req.headers['user-agent'] || '';
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';
    const geo = geoip.lookup(ipAddress);
    const location = geo
      ? `${geo.city}, ${geo.region}, ${geo.country}`
      : 'Unknown';
    const source = req.useragent;
    const device = source?.isMobile
      ? 'Mobile'
      : source?.isTablet
        ? 'Tablet'
        : 'Desktop';

    const newSession = new SessionToken({
      userId: newUser._id,
      token: cookie,
      userAgent,
      ipAddress,
      device,
      location,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await newSession.save();
    res.cookie(envConf.COOKIE_NAME, cookie, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res
      .status(201)
      .json(new ApiResponse(201, 'User registered successfully', newUser));
  }

  public async verifyEmail(req: Request, res: Response) {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            'Invalid or expired verification token',
            undefined,
            undefined
          )
        );
      return;
    }

    if (
      !user.emailVerificationTokenExpires ||
      (user.emailVerificationTokenExpires &&
        user.emailVerificationTokenExpires < new Date())
    ) {
      console.log(
        new Date().getTime() -
          new Date(user.emailVerificationTokenExpires as Date).getTime()
      );
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            'Verification token has expired',
            undefined,
            undefined
          )
        );
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Email verified successfully',
          undefined,
          undefined
        )
      );
  }

  public async resendVerificationEmail(req: Request, res: Response) {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(404).json(
        new ApiResponse(404, 'User not found', undefined, {
          email: 'Email is not registered',
        })
      );
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json(
        new ApiResponse(400, 'Email is already verified', undefined, {
          email: 'Email is already verified',
        })
      );
      return;
    }

    const emailVerificationToken = generateRandomToken(32);
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // Token valid for 10 minutes

    await sendEmail(
      user.email,
      'Resend Verification Email',
      generateVerificationEmail(
        user.name,
        `${envConf.NODE_ENV === 'development' ? envConf.BASE_URL : envConf.FRONTEND_URL}/auth/verify-email/${emailVerificationToken}`
      ).emailBody,
      generateVerificationEmail(
        user.name,
        `${envConf.NODE_ENV === 'development' ? envConf.BASE_URL : envConf.FRONTEND_URL}/auth/verify-email/${emailVerificationToken}`
      ).emailText
    );

    await user.save();

    res
      .status(200)
      .json(new ApiResponse(200, 'Verification email resent successfully'));
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      res.status(404).json(
        new ApiResponse(404, 'User not found', undefined, {
          email: 'Email is not registered',
        })
      );
      return;
    }

    if (!user.isEmailVerified) {
      res.status(400).json(
        new ApiResponse(400, 'Email is not verified', undefined, {
          email: 'Please verify your email before logging in',
        })
      );
      return;
    }

    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json(
        new ApiResponse(401, 'Invalid credentials', undefined, {
          password: 'Incorrect password',
        })
      );
      return;
    }

    const userId = user._id;
    const cookie = generateJWTCookie(String(userId));

    const userAgent = req.headers['user-agent'] || '';
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';
    const geo = geoip.lookup(ipAddress);
    const location = geo
      ? `${geo.city}, ${geo.region}, ${geo.country}`
      : 'Unknown';
    const source = req.useragent;
    const device = source?.isMobile
      ? 'Mobile'
      : source?.isTablet
        ? 'Tablet'
        : 'Desktop';

    const newSession = new SessionToken({
      userId: user._id,
      token: cookie,
      userAgent,
      ipAddress,
      device,
      location,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await newSession.save();
    res.cookie(envConf.COOKIE_NAME, cookie, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res
      .status(200)
      .json(new ApiResponse(200, 'Login successful', undefined, undefined));
  }

  public async getProfile(req: Request, res: Response) {
    const { user } = req.body;

    res.send(new ApiResponse(200, 'Profile fetched', user, undefined));
  }

  public async logout(req: Request, res: Response) {
    const { user, token } = req.body;

    const sessionToken = await SessionToken.findOne({
      userId: user._id,
      token,
    });

    if (!sessionToken) {
      res
        .status(401)
        .json(new ApiResponse(401, 'Unauthorized', undefined, undefined));
      return;
    }

    sessionToken.isBlackListed = true;

    await sessionToken.save();
    res.send(new ApiResponse(200, 'Logout successful', user, undefined));
  }

  public async logoutAll(req: Request, res: Response) {
    const { user, token } = req.body;

    await SessionToken.updateMany(
      {
        userId: user._id,
      },
      {
        isBlackListed: true,
      },
      {
        new: true,
      }
    );
    res.send(
      new ApiResponse(200, 'Logout all successful', undefined, undefined)
    );
  }

  public async resetPasswordRequest(req: Request, res: Response) {
    const { email } = req.body;

    const token = generateRandomToken(32);

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res
        .status(400)
        .json(
          new ApiResponse(400, 'No such user exists', undefined, undefined)
        );
      return;
    }

    // generatePasswordResetMail
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetToken = token;
    user.passwordResetTokenExpires = expiryTime;

    await sendEmail(
      user.email,
      'Resend Verification Email',
      generateVerificationEmail(
        user.name,
        envConf.NODE_ENV === 'development'
          ? `${envConf.BASE_URL}/api/v1/auth/reset-password/${token}`
          : `${envConf.FRONTEND_URL}/auth/reset-password/${token}`
      ).emailBody,
      generateVerificationEmail(
        user.name,
        envConf.NODE_ENV === 'development'
          ? `${envConf.BASE_URL}/api/v1/auth/reset-password/${token}`
          : `${envConf.FRONTEND_URL}/auth/reset-password/${token}`
      ).emailText
    );

    await user.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, 'Password reset URL sent', undefined, undefined)
      );
  }

  public async changePassword(req: Request, res: Response) {
    const {token} = req.params;

    const { email, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      email: email,
    });

    if (!user) {
      res
        .status(404)
        .json(new ApiResponse(404, 'Email not found', undefined, undefined));
      return;
    }

    const timeDiff =
      Date.now() - new Date(user.passwordResetTokenExpires as Date).getTime();

    if (timeDiff >= 0) {
      res
        .status(400)
        .json(new ApiResponse(400, 'Link expired', undefined, undefined));
      return;
    }

    user.password = password;

    await user.save();
    res
      .status(200)
      .json(new ApiResponse(200, 'Password updated !', undefined, undefined));
    return;
  }
}

export default Controller;
