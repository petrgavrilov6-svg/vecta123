import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  assignedToUserId: z.string().uuid().optional().or(z.literal('')),
});

export const updateClientSchema = createClientSchema.partial().extend({
  name: z.string().min(1, 'Имя обязательно').optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// Deal schemas
export const createDealSchema = z.object({
  clientId: z.string().uuid().optional().or(z.literal('')),
  stage: z.string().min(1, 'Этап сделки обязателен'),
  amount: z.number().positive().optional().or(z.number().nonpositive().transform(() => undefined)),
  assignedToUserId: z.string().uuid().optional().or(z.literal('')),
});

export const updateDealSchema = createDealSchema.partial().extend({
  stage: z.string().min(1, 'Этап сделки обязателен').optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно'),
  description: z.string().optional().or(z.literal('')),
  dueAt: z.string().datetime().optional().or(z.literal('')),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'], {
    errorMap: () => ({ message: 'Статус должен быть: TODO, IN_PROGRESS, DONE, CANCELLED' }),
  }),
  assignedToUserId: z.string().uuid().optional().or(z.literal('')),
  relatedClientId: z.string().uuid().optional().or(z.literal('')),
  relatedDealId: z.string().uuid().optional().or(z.literal('')),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  title: z.string().min(1, 'Название задачи обязательно').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Member schemas
export const createInviteSchema = z.object({
  email: z.string().email('Некорректный email'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'AGENT', 'VIEWER'], {
    errorMap: () => ({ message: 'Роль должна быть: OWNER, ADMIN, MANAGER, AGENT, VIEWER' }),
  }),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

// Chat schemas
export const createChatRoomSchema = z.object({
  name: z.string().min(1, 'Название комнаты обязательно'),
  type: z.enum(['DIRECT', 'GROUP', 'CHANNEL'], {
    errorMap: () => ({ message: 'Тип должен быть: DIRECT, GROUP, CHANNEL' }),
  }),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым'),
});

export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Название шаблона обязательно'),
  subject: z.string().optional().or(z.literal('')),
  body: z.string().min(1, 'Содержимое шаблона обязательно'),
  type: z.enum(['EMAIL', 'SMS'], {
    errorMap: () => ({ message: 'Тип должен быть: EMAIL, SMS' }),
  }),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  name: z.string().min(1, 'Название шаблона обязательно').optional(),
  body: z.string().min(1, 'Содержимое шаблона обязательно').optional(),
});

// Campaign schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Название кампании обязательно'),
  templateId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED']).optional(),
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
  recipientEmails: z.array(z.string().email()).min(1, 'Необходимо указать хотя бы одного получателя'),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  name: z.string().min(1, 'Название кампании обязательно').optional(),
  recipientEmails: z.array(z.string().email()).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// Integration schemas
export const createIntegrationSchema = z.object({
  type: z.enum(['EMAIL', 'TELEGRAM', 'VK', 'WHATSAPP'], {
    errorMap: () => ({ message: 'Тип интеграции должен быть EMAIL, TELEGRAM, VK или WHATSAPP' }),
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional().default('INACTIVE'),
  dataJson: z.string().optional(),
});

export const updateIntegrationSchema = createIntegrationSchema.partial();

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;

// Invoice schemas
export const createInvoiceSchema = z.object({
  number: z.string().min(1, 'Номер счёта обязателен'),
  amount: z.number().positive('Сумма должна быть положительной'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'CANCELLED']).optional().default('DRAFT'),
  dueAt: z.string().datetime().optional().or(z.literal('')),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  number: z.string().min(1, 'Номер счёта обязателен').optional(),
  amount: z.number().positive('Сумма должна быть положительной').optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// Payment schemas
export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Некорректный ID счёта'),
  amount: z.number().positive('Сумма должна быть положительной'),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'CASH', 'OTHER'], {
    errorMap: () => ({ message: 'Метод оплаты должен быть CARD, BANK_TRANSFER, CASH или OTHER' }),
  }),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional().default('PENDING'),
  externalId: z.string().optional().or(z.literal('')),
  metadataJson: z.string().optional().or(z.literal('')),
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  invoiceId: z.string().uuid('Некорректный ID счёта').optional(),
  amount: z.number().positive('Сумма должна быть положительной').optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// Deal Checklist schemas
export const updateChecklistItemSchema = z.object({
  itemTitle: z.string().min(1, 'Название пункта обязательно'),
  completed: z.boolean(),
});

export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
