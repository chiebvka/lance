import { z } from 'zod'

export const pathEntrySchema = z.object({
  id: z.string().uuid(),
  position: z.number(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().min(1, 'URL is required'),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  vibrancy: z.number().optional().nullable(),
  clickable: z.boolean().optional(),
  type: z.enum(['link', 'website', 'email', 'phone']),
})

export const pathsContentSchema = z.object({
  version: z.number(),
  entries: z.array(pathEntrySchema),
})

export const createPathSchema = z.object({
  action: z.enum(['save_draft', 'publish', 'send_path']).optional(),
  name: z.string().min(1, 'Path name is required'),
  description: z.string().optional().nullable(),
  content: pathsContentSchema.optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  protect: z.boolean().optional(),
  recipientEmail: z.string().email().optional().nullable(),
  recepientName: z.string().optional().nullable(),
})
