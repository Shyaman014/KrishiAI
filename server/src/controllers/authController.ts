import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User'
import { Activity } from '../models/Activity'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/authValidators'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../utils/token'
import { emailService } from '../services/emailService'
import logger from '../utils/logger'

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      })
      return
    }

    // Create user
    const user = new User({
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
      preferredLanguage: data.preferredLanguage,
      role: 'farmer',
      isVerified: true,
    })

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    })

    const { token: refreshToken, family } = generateRefreshToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    })

    // Store hashed refresh token
    user.refreshTokens = [
      {
        tokenHash: hashToken(refreshToken),
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    ]

    await user.save()

    // Log account creation activity
    try {
      await Activity.create({
        userId: user._id,
        type: 'account_created',
        title: 'Account Created',
        description: `Welcome to KrishiAI. Account established for ${user.fullName}.`,
        metadata: { email: user.email, language: user.preferredLanguage },
      })
    } catch (activityErr) {
      logger.error('Failed to log account_created activity', activityErr)
    }

    // Set HttpOnly refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions(true))

    logger.info(`User registered successfully: ${user.email} (${user._id})`)

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: user.toSafeObject(),
        accessToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, rememberMe } = loginSchema.parse(req.body)

    // Find user by email with password & refresh tokens
    const user = await User.findOne({ email }).select('+password +refreshTokens')

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
      return
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    })

    const { token: refreshToken, family } = generateRefreshToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    })

    // Prune expired or excessive refresh tokens (keep last 5)
    const now = new Date()
    const activeTokens = (user.refreshTokens || []).filter((t) => t.expiresAt > now)

    activeTokens.push({
      tokenHash: hashToken(refreshToken),
      family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
    })

    user.refreshTokens = activeTokens.slice(-5)
    await user.save()

    // Set HttpOnly refresh cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions(rememberMe))

    logger.info(`User logged in: ${user.email} (${user._id})`)

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toSafeObject(),
        accessToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]

    if (!rawToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found in cookies.',
      })
      return
    }

    let payload
    try {
      payload = verifyRefreshToken(rawToken)
    } catch (err) {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions())
      res.status(401).json({
        success: false,
        message: 'Refresh token expired or invalid.',
      })
      return
    }

    const tokenHash = hashToken(rawToken)
    const user = await User.findById(payload.userId).select('+refreshTokens')

    if (!user) {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions())
      res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      })
      return
    }

    // Check if token exists in user's active tokens
    const tokenRecord = user.refreshTokens.find((t) => t.tokenHash === tokenHash)

    if (!tokenRecord) {
      // Token reuse detected! Invalidate all tokens in this family for security
      logger.warn(`Security alert: Refresh token reuse detected for user ${user.email}! Invalidating family.`)
      user.refreshTokens = user.refreshTokens.filter((t) => t.family !== payload.family)
      await user.save()

      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions())
      res.status(403).json({
        success: false,
        message: 'Security warning: Refresh token reuse detected. Please log in again.',
      })
      return
    }

    // Token is valid: Rotate refresh token within same family
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    })

    const { token: newRefreshToken, family } = generateRefreshToken(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      payload.family,
    )

    // Remove the consumed token and add the new one
    user.refreshTokens = user.refreshTokens
      .filter((t) => t.tokenHash !== tokenHash && t.expiresAt > new Date())
      .concat({
        tokenHash: hashToken(newRefreshToken),
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      })

    await user.save()

    // Send new refresh token in cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, getRefreshTokenCookieOptions(true))

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        accessToken: newAccessToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]

    if (rawToken) {
      try {
        const payload = verifyRefreshToken(rawToken)
        const user = await User.findById(payload.userId).select('+refreshTokens')
        if (user) {
          // Invalidate the token family
          user.refreshTokens = user.refreshTokens.filter((t) => t.family !== payload.family)
          await user.save()
        }
      } catch {
        // Token was invalid, proceed with clearing cookie
      }
    }

    // Clear HttpOnly cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions())

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId)
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires')

    // Always return 200 for security to prevent account enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      })
      return
    }

    // Generate single-use crypto token
    const resetToken = generateRandomToken()
    user.resetPasswordToken = hashToken(resetToken)
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    // Send email (or log in dev)
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName)

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
      // In development / test mode, we also return the token for testing convenience
      ...(process.env.NODE_ENV !== 'production' && { devResetToken: resetToken }),
    })
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body)

    const tokenHash = hashToken(token)

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +refreshTokens')

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      })
      return
    }

    // Update password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    // Invalidate all existing refresh tokens
    user.refreshTokens = []
    await user.save()

    logger.info(`Password reset successfully for user: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    })
  } catch (error) {
    next(error)
  }
}

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = verifyEmailSchema.parse(req.body)
    const tokenHash = hashToken(token)

    const user = await User.findOne({
      verificationToken: tokenHash,
      verificationTokenExpires: { $gt: new Date() },
    })

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Email verification token is invalid or has expired.',
      })
      return
    }

    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is active.',
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateProfileSchema.parse(req.body)

    const user = await User.findById(req.user?.userId)
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      })
      return
    }

    if (data.fullName !== undefined) user.fullName = data.fullName
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber
    if (data.preferredLanguage !== undefined) user.preferredLanguage = data.preferredLanguage
    if (data.profileImage !== undefined) user.profileImage = data.profileImage

    await user.save()

    // Log profile update activity
    try {
      await Activity.create({
        userId: user._id,
        type: 'profile_updated',
        title: 'Profile Updated',
        description: 'Farmer profile information was successfully updated.',
      })
    } catch (activityErr) {
      logger.error('Failed to log profile_updated activity', activityErr)
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: user.toSafeObject(),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    const user = await User.findById(req.user?.userId).select('+password +refreshTokens')
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      })
      return
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      })
      return
    }

    user.password = newPassword
    // Revoke all existing refresh sessions
    user.refreshTokens = []
    await user.save()

    // Log password change activity
    try {
      await Activity.create({
        userId: user._id,
        type: 'password_changed',
        title: 'Security Updated',
        description: 'Account password was changed and active sessions secured.',
      })
    } catch (activityErr) {
      logger.error('Failed to log password_changed activity', activityErr)
    }

    // Clear refresh cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions())

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    })
  } catch (error) {
    next(error)
  }
}
