import { SetMetadata } from '@nestjs/common';
import type { RoleName } from './auth.types.js';

export const ROLES_KEY = 'roles';

// Restricts a route or controller to these roles. Use together with AuthGuard.
// Without @Roles, any signed-in user may call the route.
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
