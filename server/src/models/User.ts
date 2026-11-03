import mongoose, { Document, Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'farmer' | 'admin'
export type UserLanguage = 'en' | 'hi' | 'pa' | 'mr' | 'te' | 'ta'

export interface IRefreshToken {
  tokenHash: string
  family: string
  expiresAt: Date
  createdAt: Date
}

export interface IUser extends Document {
  fullName: string
  email: string
  phoneNumber?: string
  password?: string
  profileImage?: string
  preferredLanguage: UserLanguage
  role: UserRole
  isVerified: boolean
  verificationToken?: string
  verificationTokenExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  refreshTokens: IRefreshToken[]
  createdAt: Date
  updatedAt: Date

  comparePassword(candidate: string): Promise<boolean>
  toSafeObject(): Record<string, unknown>
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    family: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'pa', 'mr', 'te', 'ta'],
      default: 'en',
    },
    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password
        delete ret.verificationToken
        delete ret.verificationTokenExpires
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.refreshTokens
        delete ret.__v
        return ret
      },
    },
  },
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidate, this.password)
}

UserSchema.methods.toSafeObject = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>
  delete obj.password
  delete obj.verificationToken
  delete obj.verificationTokenExpires
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  delete obj.refreshTokens
  delete obj.__v
  return obj
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
