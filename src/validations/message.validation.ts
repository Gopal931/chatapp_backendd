import { z } from 'zod';

// ── Send a message ─────────────────────────────────────────────────────────────
export const sendMessageSchema = z.object({
  conversationId: z
    .string({ required_error: 'conversationId is required' })
    .min(1, 'conversationId cannot be empty'),
  text: z.string().min(1, 'Message cannot be empty').optional(),
  content: z.string().min(1, 'Message cannot be empty').optional(),
}).refine(
  (data) => data.text || data.content,
  { message: 'Message text is required', path: ['text'] }
);

// ── Edit a message ──
export const editMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').optional(),
  content: z.string().min(1, 'Message cannot be empty').optional(),
}).refine(
  (data) => data.text || data.content,
  { message: 'Message text is required', path: ['text'] }
);

// ── Create a conversation ──────────────────────────────────────────────────────

export const createConversationSchema = z.union([
  // Direct (1-on-1) conversation — isGroup is false or omitted
  z.object({
    isGroup: z.literal(false).optional(),
    participantId: z.string({ required_error: 'participantId is required' }).min(1),
  }),
  // Group conversation — isGroup must be true
  z.object({
    isGroup: z.literal(true),
    groupName: z
      .string({ required_error: 'Group name is required' })
      .min(1, 'Group name cannot be empty')
      .max(50, 'Group name is too long')
      .trim(),
    participantIds: z
      .array(z.string())
      .min(1, 'At least 1 other participant is required'),
  }),
]);

// ── Exported TypeScript types ──────────────────────────────────────────────────
export type SendMessageInput= z.infer<typeof sendMessageSchema>;
export type EditMessageInput= z.infer<typeof editMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
