import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { AuthResponse, ApiResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create new user
    user = new User({
      email,
      password, // Will be hashed by pre-save hook
      name,
      preferences: {
        defaultFormat: 'NOVEL',
        theme: 'light',
        aiSuggestions: true
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }
    };

    res.status(201).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // Set by auth middleware
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user data'
    });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { preferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.preferences = {
      ...user.preferences,
      ...preferences
    };

    await user.save();

    res.json({
      success: true,
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating preferences'
    });
  }
};