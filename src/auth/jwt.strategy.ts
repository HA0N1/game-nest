import _ from 'lodash';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request, request } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      if (!payload) {
        fetch('https://chunsik.store/user/refreshToken', {
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
    } catch (err) {
      console.log('***********', err);

      if (err instanceof TokenExpiredError) {
        fetch('https://chunsik.store/user/refreshToken', {
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
    }
  }
}
