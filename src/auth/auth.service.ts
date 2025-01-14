import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariables } from '../common/const/env.const';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { UserService } from '../user/user.service';
// import { PrismaService } from '../common/prisma.service';
import { Role } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../user/schema/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    // private readonly prisma: PrismaService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async tokenBlock(token: string) {
    const payload = this.jwtService.decode(token);
    const expiryDate = +new Date(payload['exp'] * 1000);
    const now = +Date.now();

    const differenceInSeconds = (expiryDate - now) / 1000;
    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      // 시간이 0이되거나 -가 되면 안됨. 주의해야함.
      Math.max(differenceInSeconds * 1000, 1),
    );
    return true;
  }

  parseBasicToken(rawToken: string) {
    // 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
    // ['Basic', $token]
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [basic, token] = basicSplit;
    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    // 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // 'email:password'로 디코딩된 상태임
    const tokenSplit = decoded.split(':');
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [email, password] = tokenSplit;
    return {
      email,
      password,
    };
  }

  /**
   * 토큰 파싱하는 부분 middleware 로 보냄
   */
  async parseBearerToken(rawToken: string, isRefresh: boolean) {
    // 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
    // ['Basic', $token]
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [bearer, token] = basicSplit;
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefresh
            ? envVariables.refreshTokenSecret
            : envVariables.accessTokenSecret,
        ),
      });
      if (isRefresh) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('refresh 토큰을 입력하세요');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력하세요');
        }
      }
      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
  }

  // rawToken -> "Basic $token"
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({
      email,
      password,
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userModel.findOne(
      {
        email,
      },
      {
        password: 1,
      },
    );
    // const user = await this.prisma.user.findUnique({
    //   where: { email },
    // });
    // const user = await this.userRepository.findOne({
    //   where: {
    //     email,
    //   },
    // });
    if (!user) {
      throw new NotFoundException('잘못된 로그인 정보입니다.');
    }
    console.log(user);
    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }
    return user;
  }

  async issueToken(user: { _id: any; role: Role }, isRefreshToken: boolean) {
    console.log('?');
    const refreshTokenSecret = this.configService.get<string>(
      envVariables.refreshTokenSecret,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVariables.accessTokenSecret,
    );
    return await this.jwtService.signAsync(
      {
        sub: user._id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 3000,
      },
    );
  }

  async loginUser(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    console.log('gg');
    const user = await this.authenticate(email, password);
    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
