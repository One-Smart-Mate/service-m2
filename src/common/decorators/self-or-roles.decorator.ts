import { SetMetadata } from '@nestjs/common';

export const SELF_OR_ROLES_KEY = 'selfOrRoles';

export interface SelfOrRolesOptions {
  source: 'params' | 'query' | 'body';
  requestKey: string;
  roles?: readonly string[];
}

export const SelfOrRoles = (options: SelfOrRolesOptions) =>
  SetMetadata(SELF_OR_ROLES_KEY, options);
