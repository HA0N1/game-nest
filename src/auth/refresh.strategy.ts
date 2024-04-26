import _ from 'lodash';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { UserController } from 'src/user/user.controller';

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          console.log(request.cookies['Refresh']);

          return request.cookies['Refresh'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }
  async validate(payload: any) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      fetch('http://localhost:3000/user/refreshToken', {
        method: 'POST',
      })
        .then(res => {
          if (res.status === 201) {
            return res.json();
          }
        })
        .then(json => {
          const newAccessToken = json.accessToken;
          window.localStorage.setItem('authorization', newAccessToken);
        })
        .catch(err => {
          console.error('accessToken 재발급 중의 Error: ', err);
        });
    }
    const user = await this.userService.findUserByEmail(payload.email);
    if (_.isNil(user)) {
      throw new NotFoundException('해당하는 사용자를 찾을 수 없습니다.');
    }

    return user;
  }
}
