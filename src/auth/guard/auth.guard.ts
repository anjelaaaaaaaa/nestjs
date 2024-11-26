import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    /**
     * 만약에 public decoration이 돼있으면
     * 모든 로직을 bypass
     *
     * @Public('여기') 파라미터로 보내는 값이 isPublic에 담겨짐.
     * 아무것도 전달 안하면 그냥 객체로 전달.
     */
    const isPublic = this.reflector.get(Public, context.getHandler());
    if (isPublic) {
      return true;
    }

    /**
     * 요청에서 user 객체가 존재하는지 확인한다.
     * 만약 존재한다면 그 의미는 인증을 통과했다는 의미임 (bearer-token middleware 에서)
     */
    const request = context.switchToHttp().getRequest();

    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}
