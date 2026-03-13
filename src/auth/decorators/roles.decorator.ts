import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../enums/roles.enum';

export const ALLOWED_ROLES_KEY = 'allowed_roles';
export const AllowedRoles = (...roles: [RolesEnum, ...RolesEnum[]]) =>
  SetMetadata(ALLOWED_ROLES_KEY, roles);
