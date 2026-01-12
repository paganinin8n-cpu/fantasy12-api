import { UserRole } from '@prisma/client';

// Exportar o tipo do Prisma como Role (compatibilidade)
export type Role = UserRole;

// Permissões do sistema
export type Permission =
  | 'USER_READ'
  | 'USER_WRITE'
  | 'ADMIN_PANEL'
  | 'AUDIT_READ';

// Mapeamento de roles para permissões
export const RolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: ['USER_READ', 'USER_WRITE', 'ADMIN_PANEL', 'AUDIT_READ'],
  PRO: ['USER_READ'],
  NORMAL: []
};