import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { TokenExpiredError } from 'jsonwebtoken';
import { Response } from '@nestjs/common';

@Catch(TokenExpiredError)
export class TokenExpiredFilter implements ExceptionFilter {
  catch(exception: TokenExpiredError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    fetch('http://chunsik.store/user/refreshToken', {
      method: 'POST',
      credentials: 'include',
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
