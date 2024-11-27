import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const UserId = createParamDecorator(
  /**
   * @UserId(data) 파라미터로 쓰는 data를 여기서 data로 받을 수 있음.
   */
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    // if (!request || !request.user || !request.user.sub) {
    //   throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    // }
    return request?.user?.sub;
  },
);
