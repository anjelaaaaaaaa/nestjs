import {
  Controller,
  Post,
  Headers,
  Request,
  UseGuards,
  Get,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  // authorization: Basic $token 이렇게 들어옴
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Public()
  @Post('login')
  // authorization: Baasic $token
  loginUser(@Headers('authorization') token: string) {
    return this.authService.loginUser(token);
  }

  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.tokenBlock(token);
  }

  // Refresh token 을 헤더로 넣어서 access token 재발급
  @Post('token/access')
  async rotateAccessToken(@Headers('authorization') token: string) {
    const payload = await this.authService.parseBearerToken(token, true);
    return {
      accessToken: await this.authService.issueToken(payload, false),
    };
  }

  // local strategy 는 이메일, 비번으로 인증
  // @UseGuards(AuthGuard('local'))
  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req) {
    // passport의 validate에서 반환하는 값은 request.user에 담겨져서 옴
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  // jwt strategy 는 토큰으로 인증
  // @UseGuards(AuthGuard('jwt'))
  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    // passport의 validate에서 반환하는 값은 request.user에 담겨져서 옴
    return req.user;
  }
}
