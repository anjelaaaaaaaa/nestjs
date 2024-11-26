import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// passport-jwt 에서 import한 Strategy의 이름은 'jwt' 임
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
// Strategy를 passport-jwt에서 불러옴.
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 어디서 jwt를 추출할지 ? Bearer $token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 만료기간을 무시할지 안할지
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  // jwt strategy에서는 validate의 파라미터로 토큰 만들때 생성했던 payload가 넘어옴
  validate(payload: any) {
    console.log('여기왓니');

    return payload;
  }
}
