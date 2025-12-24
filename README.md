# VECTA CRM

SaaS CRM система с разделением на frontend (клиентский продукт), admin (внутренняя админка) и backend (единый API).

## Структура проекта

```
vecta/
├── frontend/          # Next.js - клиентский продукт
├── admin/            # Next.js - внутренняя админка VECTA
├── backend/          # Express/Fastify API + Prisma
├── docker-compose.yml
└── package.json      # Монорепо с npm workspaces
```

## Требования

- Node.js 18+ 
- Docker Desktop (для PostgreSQL)
- PowerShell (Windows 10/11)

## Быстрый старт (PowerShell)

### 1. Клонирование и установка зависимостей

```powershell
npm install
```

### 2. Запуск базы данных

```powershell
npm run db:up
```

Проверьте, что PostgreSQL запущен:
```powershell
docker ps
```

### 3. Запуск проекта

**Важно:** Если при запуске появляется ошибка `ENOWORKSPACES`, это связано с тем, что npm видит workspaces в корневом package.json. Это не критично - проект все равно запускается.

**Запуск всех сервисов:**
```powershell
npm run dev
```

**Запуск отдельных сервисов:**
```powershell
# Frontend (порт 3000)
cd frontend
npm run dev

# Backend (порт 4000)
cd backend
npm run dev

# Admin (порт 3001)
cd admin
npm run dev
```

### 4. Настройка переменных окружения

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# Database
DATABASE_URL=postgresql://vecta:vecta123@localhost:5432/vecta_crm?schema=public

# Backend
BACKEND_PORT=4000
NODE_ENV=development

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Admin
ADMIN_PORT=3001
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:4000

# Session
SESSION_COOKIE_NAME=vecta_session
SESSION_SECRET=change-this-to-random-secret-key-in-production-min-32-chars

# Platform Admin
PLATFORM_ADMIN_EMAIL=admin@vecta.local
PLATFORM_ADMIN_PASSWORD=admin123
```

Или скопируйте из примера (если файл существует):
```powershell
Copy-Item .env.example .env
```

### 4. Применение миграций и заполнение тестовыми данными

```powershell
npm run prisma:migrate
npm run prisma:seed
```

### 5. Запуск всех сервисов

```powershell
npm run dev
```

Это запустит:
- **Backend API**: http://localhost:4000
- **Frontend**: http://localhost:3000
- **Admin**: http://localhost:3001

## Отдельные команды

### База данных

```powershell
# Запуск PostgreSQL
npm run db:up

# Остановка
npm run db:down

# Логи
npm run db:logs

# Prisma Studio (GUI для БД)
npm run prisma:studio
```

### Миграции

```powershell
# Применить миграции
npm run prisma:migrate

# Заполнить тестовыми данными
npm run prisma:seed
```

### Разработка

```powershell
# Все сервисы одновременно
npm run dev

# Только backend
npm run dev:backend

# Только frontend
npm run dev:frontend

# Только admin
npm run dev:admin
```

## Тестовые данные

После выполнения `npm run prisma:seed` создаются:

### Клиентский аккаунт
- **Email**: `user@test.local`
- **Password**: `test123`
- Workspace: `test-workspace` с тестовыми клиентами, сделками и задачами

### Платформенный админ
- **Email**: `admin@vecta.local` (из .env)
- **Password**: `admin123` (из .env)

## Порты

- **Frontend**: 3000
- **Admin**: 3001
- **Backend API**: 4000
- **PostgreSQL**: 5432
- **PgAdmin**: 5050 (опционально)

## Структура API

Все запросы к backend должны включать credentials (cookies) для сессий.

Формат ответа:
- Успех: `{ success: true, data: ... }`
- Ошибка: `{ success: false, error: { code, message, details? } }`

## Разработка

Проект использует npm workspaces для управления монорепо. Каждая папка (frontend, backend, admin) - отдельное приложение с собственным package.json.

