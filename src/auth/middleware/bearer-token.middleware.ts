import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { envVariables } from '../../common/const/env.const';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // Bearer $token
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);
      /**
       * decode() 는 검증은 하지않고 그냥 payload 확인할 수 있음.
       */
      const decodedPayload = this.jwtService.decode(token);
      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new BadRequestException('잘못된 토큰입니다.');
      }
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariables.refreshTokenSecret
          : envVariables.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료됐습니다.');
      }
      /**
       * 어차피 미들웨어에서 작업 끝나면 authGuard로 가기때문에 req.user가 없다면
       * 거기서 에러를 던질거임.
       */
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    // 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
    // ['Basic', $token]
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [bearer, token] = basicSplit;
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    return token;
  }
}
