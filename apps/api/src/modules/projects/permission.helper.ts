import type { Db } from '../../database/client.js';
import { ForbiddenError } from '../../plugins/error-handler.plugin.js';
import { getUserRoleInProject } from './project.service.js';

export type ProjectPermission =
  | 'project:delete'
  | 'project:edit'
  | 'collaborator:manage'
  | 'session:create'
  | 'session:edit_own'
  | 'session:edit_others'
  | 'conflict:resolve'
  | 'data:read';

const OWNER_PERMISSIONS: ReadonlySet<ProjectPermission> = new Set([
  'project:delete',
  'project:edit',
  'collaborator:manage',
  'session:create',
  'session:edit_own',
  'session:edit_others',
  'conflict:resolve',
  'data:read',
]);

const ADMIN_PERMISSIONS: ReadonlySet<ProjectPermission> = new Set([
  'project:edit',
  'collaborator:manage',
  'session:create',
  'session:edit_own',
  'session:edit_others',
  'conflict:resolve',
  'data:read',
]);

const MEMBER_PERMISSIONS: ReadonlySet<ProjectPermission> = new Set([
  'session:create',
  'session:edit_own',
  'conflict:resolve',
  'data:read',
]);

export function getPermissions(role: 'owner' | 'admin' | 'member'): ReadonlySet<ProjectPermission> {
  switch (role) {
    case 'owner':
      return OWNER_PERMISSIONS;
    case 'admin':
      return ADMIN_PERMISSIONS;
    case 'member':
      return MEMBER_PERMISSIONS;
  }
}

export async function assertPermission(
  db: Db,
  projectId: string,
  userId: string,
  permission: ProjectPermission,
): Promise<void> {
  const role = await getUserRoleInProject(db, projectId, userId);
  if (!role) {
    throw new ForbiddenError('Not a project owner or collaborator');
  }
  const permissions = getPermissions(role);
  if (!permissions.has(permission)) {
    throw new ForbiddenError(`Insufficient permissions: ${permission} requires ${permission === 'project:delete' ? 'owner' : 'admin'} role`);
  }
}
