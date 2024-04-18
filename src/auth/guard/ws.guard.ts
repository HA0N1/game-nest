import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { UserService } from 'src/user/user.service';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient();
    const headers = socket.handshake.headers;
    const rawToken = headers['authorization'];
    if (!rawToken) {
      throw new WsException('토큰이 없습니다.');
    }
    try {
      const token = rawToken.split(' ')[1];

      const payload = this.jwtService.verify(token, { secret: this.config.get<string>('JWT_SECRET_KEY') });
      const user = await this.userService.findUserByEmail(payload.email);

      socket.user = user;
      socket.token = token;
      socket.tokenType = payload.tokenType;
      return true;
    } catch (error) {
      throw new WsException(error.message);
    }
  }
}
