import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Team from '../models/Team.js';
import logger from '../utils/logger.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key-123-super-secure', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('token', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      ...validatedData,
      role: 'admin',
      verificationToken,
      verificationTokenExpires,
    });

    // Automatically create a default team workspace for the admin
    const team = await Team.create({
      name: `${user.name}'s Workspace`,
      owner: user._id,
      members: [{ user: user._id, role: 'admin' }],
    });

    user.teamId = team._id;
    await user.save();

    // Normally send verification email here
    logger.info(`User registered: ${user.email}. Verification Token: ${verificationToken}`);

    // Automatically log user in upon registration
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email }).select('+password');
    if (!user || !(await user.comparePassword(validatedData.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Populate teamId if missing
    if (!user.teamId) {
      let team = await Team.findOne({ owner: user._id });
      if (!team) {
        team = await Team.create({
          name: `${user.name}'s Workspace`,
          owner: user._id,
          members: [{ user: user._id, role: 'admin' }],
        });
      }
      user.teamId = team._id;
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 500),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('teamId');
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error(`getMe error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: validatedData.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    logger.info(`Password reset link requested for ${user.email}. Token: ${resetToken}`);

    // Mock response details
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      resetToken, // for testing purposes
    });
  } catch (error) {
    logger.error(`forgotPassword error: ${error.message}`);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = validatedData.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`resetPassword error: ${error.message}`);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
    });
  } catch (error) {
    logger.error(`verifyEmail error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
