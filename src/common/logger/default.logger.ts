import { ConsoleLogger, Injectable } from '@nestjs/common';

/**
 * logger 를 커스텀해서 이렇게 사용할 수 있음.
 * 그럼 기존의 log 기능포함. 다른 기능까지 추가할 수 있음.
 * 이걸 common.module에서 provider, exports에 추가하고 다른데서 constructor에 주입받아서
 * 사용가능함 !
 */
@Injectable()
export class DefaultLogger extends ConsoleLogger {
  warn(message: unknown, ...rest: unknown[]) {
    super.warn(message, ...rest);
  }

  error(message: unknown, ...rest: unknown[]) {
    super.error(message, ...rest);
  }
}
