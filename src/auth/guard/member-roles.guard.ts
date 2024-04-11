import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMember } from 'src/channel/entities/channelMember.entity';
import { MemberRole } from 'src/channel/type/MemberRole.type';
import { ROLES_KEY } from 'src/utils/decorators/member-role.decorator';
import { Repository } from 'typeorm';

@Injectable()
export class RolesGuard extends AuthGuard('jwt') implements CanActivate {
  /**
   * 생성자 안에 넣지않아도 inject 가능, 부모클래스가 필요없는 dependency를 자식클래스가 필요할 때가 있는데,
   * 생성자로 만들면 부모클래스가 사용하지 않아도 inject해야하는 경우가 생김.
   * => 프로퍼티베이스 인젝트하면 부모 인젝트 안해도 구현가능
   */

  @InjectRepository(ChannelMember) private readonly channelMemberRepository: Repository<ChannelMember>;
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    // jwt 인즈 됐는지
    const authenticated = super.canActivate(context);
    if (!authenticated) throw new UnauthorizedException('인증 정보가 잘못되었습니다');

    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    console.log('RolesGuard ~ canActivate ~ req:', req);

    // return requiredRoles.some(role => user.roles?.includes(role));
  }
}
