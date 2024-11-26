import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

// passport-local 에서 import한 Strategy의 이름은 'local'임
export class LocalAuthGuard extends AuthGuard('local') {}

// email, password로 인증할 수 있는 전략
@Injectable()
// PassportStrategy의 두번재 파라미터 'local'은 기본값임. 생략해도됨. 다른 이름 지정하는것도 가능
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      // 원래는 username이 기본 필드인데 원하는 이름대로 변경가능함
      usernameField: 'email',
    });
  }

  /**
   * local strategy 는 validate 로 2개 파라미터가 전달됨 -> username, password
   *
   * 여기서 return 하는 값을 라우터의 request.user에서 받을 수 있음.
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);
    return user;
  }
}
