import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

interface JwtPayload {
  userId: string;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Check if user exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    // Add user id to request object
    (req as any).userId = decoded.userId;
    (req as any).user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

// Middleware to check if user has admin privileges
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user exists in request (set by auth middleware)
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during authorization'
    });
  }
};

// Rate limiting middleware
export const rateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const userId = (req as any).userId || req.ip;

    // Get user's request timestamps
    const userRequests = requests.get(userId) || [];

    // Filter out old requests outside the window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < windowMs
    );

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    // Add current request timestamp
    recentRequests.push(now);
    requests.set(userId, recentRequests);

    next();
  };
};

// Validate required fields middleware
export const validateFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};