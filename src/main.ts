import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  const config = new DocumentBuilder()
    .setTitle('넷플릭스')
    .setDescription('코드팩토리 넷플릭스 렉쳐')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  /**
   * !!!! 버저닝 !!!!
   */
  // app.setGlobalPrefix('v1'); global 하게 prefix 적용됨
  // app.enableVersioning({
  /**
   * URI 버저닝 설정하는 경우 defaultVersion 설정하면 됨.
   */
  // type: VersioningType.URI,
  // defaultVersion: ['1'], // 버전 지정 리스트로 가능함.
  /**
   * HEADER 버저닝으로 설정하는 경우 'version' 키 값을 설정함. (키 값은 아무거나)
   * 그리고 요청 헤더에 version: 숫자 넣어서 요청 보내면 해당 버전으로 요청 전달됨.
   */
  // type: VersioningType.HEADER,
  // header: 'version',
  /**
   * MEDIA_TYPE 버저닝인 경우 요청 헤더에
   * Accept라는 키로 application/json;v=1   values를 전달하면 됨.
   */
  // type: VersioningType.MEDIA_TYPE,
  // key: 'v=',
  // });

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
