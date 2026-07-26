import { z } from 'zod';
import { validate } from './auth.validation.js';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').trim(),
    description: z.string().optional(),
    managerId: z.string().length(24, 'Invalid manager user ID').optional(),
  }),
  params: z.object({
    workspaceId: z.string().length(24, 'Invalid workspace ID'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').trim().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'completed', 'archived']).optional(),
  }),
  params: z.object({
    projectId: z.string().length(24, 'Invalid project ID'),
  }),
});

export const projectIdSchema = z.object({
  params: z.object({
    projectId: z.string().length(24, 'Invalid project ID'),
  }),
});

export const addProjectMemberSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().length(24, 'Invalid user ID')),
    role: z.enum(['manager', 'member', 'viewer']).optional(),
  }),
  params: z.object({
    projectId: z.string().length(24, 'Invalid project ID'),
  }),
});

export const updateProjectMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['manager', 'member', 'viewer']),
  }),
  params: z.object({
    projectId: z.string().length(24, 'Invalid project ID'),
    memberId: z.string().length(24, 'Invalid member ID'),
  }),
});

export { validate };
