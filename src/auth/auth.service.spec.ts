import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from '../user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { afterEach, describe } from 'node:test';
import { BadRequestException } from '@nestjs/common';

const mockUserRepository = {
  findOne: jest.fn(),
};
const mockConfigService = {
  get: jest.fn(),
};
const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};
const mockCachManager = {
  set: jest.fn(),
};
const mockUserService = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCachManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);
      await authService.tokenBlock(token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', () => {
      /// decode를 인코딩한 값임. (test@test.com , 123)
      /**
       * 왜냐면 parseBasicToken 메서드로 가보면, 뭔가 dependency를 모킹하는거 없이
       * 실제로 다 진행되는 부분들이라서..
       */
      const rawToken = 'Basic dGVzdEB0ZXN0LmNvbToxMjM=';
      const result = authService.parseBasicToken(rawToken);
      const decode = { email: 'test@test.com', password: '123' };
      expect(result).toEqual(decode);
    });
    it('should throw an error for invalid Token Format', () => {
      const rawToken = 'invalidTokenFormat';
      /**
       * promise를 throw할때는 rejects 했었는데 그냥 메서드를 에러 던질때는
       * expect안에 함수로 꼭 실행을 해주어야함.
       */
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
    it('should throw an error for invalid Basic Token Format', () => {
      const rawToken = 'Bearer invalidTokenFormat';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid Basic Token Format', () => {
      const rawToken = 'Basic a';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });
});
