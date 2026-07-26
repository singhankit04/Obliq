import { z } from 'zod';
import { validate } from './auth.validation.js';

const assignedToSchema = z.array(z.string().length(24, 'Invalid user ID')).optional();

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required').trim(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable(),
    assignedTo: assignedToSchema,
  }),
  params: z.object({
    projectId: z.string().length(24, 'Invalid project ID'),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required').trim().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable(),
    assignedTo: assignedToSchema,
  }),
  params: z.object({
    taskId: z.string().length(24, 'Invalid task ID'),
  }),
});

export const taskIdSchema = z.object({
  params: z.object({
    taskId: z.string().length(24, 'Invalid task ID'),
  }),
});

export { validate };
