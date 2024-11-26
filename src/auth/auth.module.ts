import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  /**
   * bearer-token middleware를 global하게 appmodule에 적용할건데 미들웨어안에 jwt service를 사용하고 있기 때문에
   * jwtModule exports 해줘야함. configservice는 이미 글로벌하게 적용되어 있음.
   */
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
