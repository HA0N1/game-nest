import { Catch, ExceptionFilter, ArgumentsHost, HttpException, UnauthorizedException } from '@nestjs/common';
import { TokenExpiredError } from 'jsonwebtoken';
import { Response, Request } from 'express';
import { AxiosResponse } from 'axios';
import { HttpAdapterHost, AbstractHttpAdapter } from '@nestjs/core';

//FIXME 토큰 만료 에러는 프론트에서 해결하기
@Catch(TokenExpiredError, UnauthorizedException)
export class TokenExpiredFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: TokenExpiredError | UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const refreshToken = request.cookies?.Refresh;

    const { httpAdapter } = this.httpAdapterHost;
    const axios = (httpAdapter as AbstractHttpAdapter).getInstance();

    // if (refreshToken) {
    //   axios.get('http://localhost:3000/user/newAccessToken', { withCredentials: true }).catch(err => {
    //     console.error('accessToken 재발급 중의 Error: ', err);
    //     throw new UnauthorizedException('토큰이 만료되었습니다.');
    //   });
    // } else {
    //   axios.get('http://localhost:3000/login').catch(err => {
    //     console.error('TokenExpiredFilter에서의 에러: ', err);
    //   });
    // }
  }
}
