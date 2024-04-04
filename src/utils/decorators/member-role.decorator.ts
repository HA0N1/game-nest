import { SetMetadata } from '@nestjs/common';
import { MemberRole } from 'src/channel/type/MemberRole.type';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);
