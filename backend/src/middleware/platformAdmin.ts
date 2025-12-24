import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types.js';

export function requirePlatformAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Требуется авторизация',
      },
    });
  }

  if (!req.user.isPlatformAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Доступ запрещён. Требуются права платформенного администратора',
      },
    });
  }

  next();
}


