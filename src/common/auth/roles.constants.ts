export const PLATFORM_ADMIN_ROLE = 'ih_sis_admin';

export const SITE_ADMIN_ROLES = [
  PLATFORM_ADMIN_ROLE,
  'local_sis_admin',
  'local_admin',
] as const;

export const normalizeRole = (role: string | null | undefined): string =>
  role?.trim().toLowerCase() ?? '';
