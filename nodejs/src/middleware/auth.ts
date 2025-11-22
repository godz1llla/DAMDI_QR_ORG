import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Authenticate middleware:', {
      authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
      url: req.url,
      method: req.method
    });
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No token in request:', {
        url: req.url,
        headers: Object.keys(req.headers)
      });
      return res.status(401).json({ success: false, message: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
    req.user = decoded;
    console.log('Token decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      restaurantId: decoded.restaurantId
    });
    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireRestaurant = (req: Request, res: Response, next: NextFunction) => {
  console.log('requireRestaurant middleware:', {
    url: req.url,
    method: req.method,
    hasUser: !!req.user,
    userRole: req.user?.role,
    restaurantId: req.user?.restaurantId
  });

  if (!req.user) {
    console.error('requireRestaurant: No user in request');
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Для SUPER_ADMIN, ADMIN и STAFF разрешаем доступ
  // Контроллеры сами проверят и получат restaurantId из БД если нужно
  if ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(req.user.role)) {
    console.log('requireRestaurant: Access granted for role:', req.user.role);
    return next();
  }

  // Для других ролей блокируем
  console.error('requireRestaurant: Access denied for role:', req.user.role);
  return res.status(403).json({ 
    success: false, 
    message: 'Restaurant access required' 
  });
};

