import { z } from 'zod';
import { validate } from './auth.validation.js';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment text is required').trim(),
    parentCommentId: z.string().optional().nullable(),
  }),
  params: z.object({
    taskId: z.string().length(24, 'Invalid task ID'),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment text is required').trim(),
  }),
  params: z.object({
    commentId: z.string().length(24, 'Invalid comment ID'),
  }),
});

export const commentIdSchema = z.object({
  params: z.object({
    commentId: z.string().length(24, 'Invalid comment ID'),
  }),
});

export const taskIdParamsSchema = z.object({
  params: z.object({
    taskId: z.string().length(24, 'Invalid task ID'),
  }),
});

export { validate };
