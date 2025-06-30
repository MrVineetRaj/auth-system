import mongoose, { Schema } from 'mongoose';
import { AVAILABLE_ROLES, USER_ROLES } from '../../lib/constants.js';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Exclude password from queries by default
    },
    role: {
      type: String,
      enum: AVAILABLE_ROLES,
      default: USER_ROLES.USER, // Default role is USER
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationTokenExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetTokenExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 });
userSchema.index({ role: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

userSchema.pre('save', function (next) {
  // Ensure that the email is always stored in lowercase
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }

  if (this.isModified('password')) {
    // encrypt password
  }

  next();
});

const User = mongoose.model('User', userSchema);
export default User;
