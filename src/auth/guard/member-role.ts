import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from 'src/channel/type/MemberRole.type';
import { ROLES_KEY } from 'src/utils/decorators/member-role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const { user } = req;

    if (!user) {
      throw new BadRequestException('요청에 유저를 식별할 수 있는 정보가 없습니다.');
    }

    const allowedRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return allowedRoles.some(role => user.userRole === role);
  }
}
