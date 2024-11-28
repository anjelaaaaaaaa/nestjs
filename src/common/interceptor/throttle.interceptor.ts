import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';
import { number } from 'joi';

@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    /**
     * cache에 URL_USERID_MINUTE라는 키값과 values(count)를 넣을거임.
     * 어떤 사용자가 어떤 요청에 몇번 요청했는지 알기 위해.
     *
     *
     */
    const userId = request?.user?.sub;

    if (!userId) {
      return next.handle();
    }
    const throttleOptions = this.reflector.get<{
      count: number;
      unit: 'minute';
    }>(Throttle, context.getHandler());
    if (!throttleOptions) {
      return next.handle();
    }
    const date = new Date();
    const minute = date.getMinutes();

    const key = `${request.method}_${request.path}_${userId}_${minute}`;
    const count = await this.cacheManager.get<number>(key);

    if (count && count >= throttleOptions.count) {
      throw new ForbiddenException('요청 가능 횟수를 넘어섰습니다.');
    }
    return next.handle().pipe(
      tap(async () => {
        const count = (await this.cacheManager.get<number>(key)) ?? 0;
        await this.cacheManager.set(key, count + 1, 60000);
      }),
    );
  }
}
