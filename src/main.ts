import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  app.useGlobalPipes(
    // class validator 사용시 필요한 설정
    new ValidationPipe({
      whitelist: true, // default는 false임 => true로 변경할 경우 dto에 정의하지 않은값은 전달하지 않음
      forbidNonWhitelisted: true, // 정의하지 않은 값을 입력한경우 에러냄
      transformOptions: {
        // class에 적힌 기반의 타입으로 입력값을 변환하게 함
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
