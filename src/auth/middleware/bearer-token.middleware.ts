import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { envVariables } from '../../common/const/env.const';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // Bearer $token
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);
    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);
    if (blockedToken) {
      throw new UnauthorizedException('차단된 토큰입니다.');
    }

    const tokenKey = `TOKEN_${token}`;

    const cachedPayload = await this.cacheManager.get(tokenKey);
    if (cachedPayload) {
      console.log('----- cache run (token) -----');
      req.user = cachedPayload;
      return next();
    }

    /**
     * decode() 는 검증은 하지않고 그냥 payload 확인할 수 있음.
     */
    const decodedPayload = this.jwtService.decode(token);
    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new BadRequestException('잘못된 토큰입니다.');
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariables.refreshTokenSecret
          : envVariables.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      /// payload['exp'] -> epoch time seconds => 이걸로 ttl 계산함
      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();

      const differenceInSeconds = (expiryDate - now) / 1000;

      await this.cacheManager.set(
        tokenKey,
        payload,
        // 시간이 0이되거나 -가 되면 안됨. 주의해야함.
        Math.max((differenceInSeconds - 30) * 1000, 1),
      );

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
