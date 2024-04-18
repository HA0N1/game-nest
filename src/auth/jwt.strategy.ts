import _ from 'lodash';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

import { Catch, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// import { TokenExpiredError } from 'jsonwebtoken';
// import { InjectRedis } from '@nestjs-modules/ioredis';
// import Redis from 'ioredis';

@Injectable()
// @Catch(TokenExpiredError)
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    // @InjectRedis() private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findUserByEmail(payload.email);
    if (_.isNil(user)) {
      throw new NotFoundException('해당하는 사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  // // TokenExpiredError를 처리하는 예외 핸들러 메서드
  // async catch(error: TokenExpiredError, payload: any) {
  //   // TokenExpiredError가 발생했을 때 새로운 액세스 토큰을 가져오는 로직을 수행
  //   const user = await this.userService.findUserByEmail(payload.email);
  //   if (_.isNil(user)) {
  //     throw new NotFoundException('해당하는 사용자를 찾을 수 없습니다.');
  //   }

  //   await this.redis.get();
  // }

  // async getNewAccessToken(){
  //   // 새로운 액세스 토큰을 가져오는 로직을 구현
  // }
}
