import mongoose from 'mongoose';

export interface ISessionToken {
  _id?: string;
  userId: mongoose.Schema.Types.ObjectId;
  token: string;
  userAgent: string;
  ipAddress: string;
  device: string;
  location: string;
  expiresAt: Date;
  isBlackListed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isBlackListed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const SessionToken = mongoose.model('SessionToken', sessionTokenSchema);

export default SessionToken;
