import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types.js';

export interface WorkspaceRequest extends AuthRequest {
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  member?: {
    id: string;
    role: string;
  };
}

export async function requireWorkspaceMember(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Пользователь не авторизован',
        },
      });
    }

    const workspaceSlug = req.params.workspaceSlug;
    if (!workspaceSlug) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Workspace slug не указан',
        },
      });
    }

    // Находим workspace по slug
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace не найден',
        },
      });
    }

    // Проверяем membership
    const member = await prisma.member.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: req.user.id,
        },
      },
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'У вас нет доступа к этому workspace',
        },
      });
    }

    req.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    };
    req.member = {
      id: member.id,
      role: member.role,
    };

    next();
  } catch (error) {
    console.error('Workspace middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка проверки workspace',
      },
    });
  }
}

// Проверка прав доступа по роли
export function requireRole(...allowedRoles: string[]) {
  return (req: WorkspaceRequest, res: Response, next: NextFunction) => {
    if (!req.member) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Доступ запрещён',
        },
      });
    }

    if (!allowedRoles.includes(req.member.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Недостаточно прав доступа',
        },
      });
    }

    next();
  };
}


