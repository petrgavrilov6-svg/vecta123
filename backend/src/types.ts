import { Request } from 'express';

// Тип User на основе Prisma схемы
// После генерации Prisma клиента можно использовать: import type { User } from '@prisma/client';
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  isPlatformAdmin: boolean;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
  sessionId?: string;
}

