import { z } from 'zod';

export const accountCreateSchema = z.object({
  platformId: z.string().min(1),
  accountId: z.string().min(1),
  accountUsername: z.string().min(1),
  accountName: z.string().min(1),
  accessToken: z.string().min(1),
});

export const accountUpdateSchema = z.object({
  accountName: z.string().min(1).optional(),
  accountUsername: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const taskCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sourceAccounts: z.array(z.string().min(1)).min(1),
  targetAccounts: z.array(z.string().min(1)).min(1),
  contentType: z.enum(['text', 'image', 'video', 'link']).optional(),
  status: z.enum(['active', 'paused', 'completed', 'error']).optional(),
  executionType: z.enum(['immediate', 'scheduled', 'recurring']).optional(),
  scheduleTime: z.string().datetime().optional(),
  recurringPattern: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  recurringDays: z.array(z.number().int()).optional(),
  filters: z
    .object({
      keywords: z.array(z.string()).optional(),
      excludeKeywords: z.array(z.string()).optional(),
      minEngagement: z.number().optional(),
      mediaOnly: z.boolean().optional(),
    })
    .optional(),
  transformations: z
    .object({
      addHashtags: z.array(z.string()).optional(),
      prependText: z.string().optional(),
      appendText: z.string().optional(),
      mediaResize: z.boolean().optional(),
    })
    .optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
