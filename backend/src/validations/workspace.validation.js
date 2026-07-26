import { z } from 'zod';
import { validate } from './auth.validation.js';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').trim(),
    description: z.string().optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').trim().optional(),
    description: z.string().optional(),
  }),
  params: z.object({
    workspaceId: z.string().length(24, 'Invalid workspace ID'),
  }),
});

export const workspaceIdSchema = z.object({
  params: z.object({
    workspaceId: z.string().length(24, 'Invalid workspace ID'),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().length(24, 'Invalid user ID')),
    role: z.enum(['manager', 'member']).optional(),
  }),
  params: z.object({
    workspaceId: z.string().length(24, 'Invalid workspace ID'),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['manager', 'member']),
  }),
  params: z.object({
    workspaceId: z.string().length(24, 'Invalid workspace ID'),
    memberId: z.string().length(24, 'Invalid member ID'),
  }),
});

export { validate };
