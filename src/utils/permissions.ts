import type { PermissionsMap } from '~/types/auth.types';

export const hasPermission = (
  permissions: PermissionsMap | null,
  module: string,
  action: 'read' | 'write',
): boolean => {
  if (!permissions || !permissions[module]) return false;
  return permissions[module].includes(action);
};
