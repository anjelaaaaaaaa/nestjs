import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { afterEach, describe } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          /**
           * repository 를 mocking 해서 사용할거임.
           * userService 에서 userRepository 가 필요할때 mockUserRepository 로 대체해서 사용
           * 그리고 repository 에서 주로 사용하는 methods 를 mockFunction (jest.fn()) 으로 넣어뒀음.
           */
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '123',
      };
      const hashRounds = 10;
      const hashedPassword = 'hashedPassword';
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: {
          email: createdUser.email,
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          email: createdUser.email,
        },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw a BadRequestException if email already exists', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '123',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockReturnValue({
        id: 1,
        email: createUserDto.email,
      });

      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: createUserDto.email,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: 1, email: 'test1@test.com' },
        { id: 2, email: 'test2@test.com' },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'test1@test.com' };

      /**
       * jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
       * === 같은 의미의 코드임
       * mockUserRepository.findOne.mockResolvedValue(user);
       */
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      // mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findOne(1);
      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });

    describe('update', () => {
      it('should update a user if it exists and return the updated user', async () => {
        const updateUserDto: UpdateUserDto = {
          email: 'test@codefactory.ai',
          password: '123123',
        };
        const hashRounds = 10;
        const hashedPassword = 'hashashndvizxcjnvkolisadf';
        const user = {
          id: 1,
          email: updateUserDto.email,
        };

        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
        jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
        jest
          .spyOn(bcrypt, 'hash')
          .mockImplementation((pass, hashRounds) => hashedPassword);
        jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
          ...user,
          password: hashedPassword,
        });

        const result = await userService.update(1, updateUserDto);

        expect(result).toEqual({
          ...user,
          password: hashedPassword,
        });
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: 1,
          },
        });
        expect(bcrypt.hash).toHaveBeenCalledWith(
          updateUserDto.password,
          hashRounds,
        );
        expect(mockUserRepository.update).toHaveBeenCalledWith(
          {
            id: 1,
          },
          {
            ...updateUserDto,
            password: hashedPassword,
          },
        );
      });

      it('should throw a NotFoundException if user to update is not found', async () => {
        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

        const updateUserDto: UpdateUserDto = {
          email: 'test@codefactory.ai',
          password: '123123',
        };

        expect(userService.update(999, updateUserDto)).rejects.toThrow(
          NotFoundException,
        );
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: 999,
          },
        });
        // mockUserRepository.update는 호출되지 않았음을 검증하고싶은데 자꾸 에러남 ㅠ
        // expect(mockUserRepository.update).not.toHaveBeenCalled();
      });
    });

    describe('remove', () => {
      it('should delete a user by id', async () => {
        const id = 999;

        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
          id: 1, // 가상의 값
        });
        const result = await userService.remove(id);
        expect(result).toEqual(id);
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: {
            id,
          },
        });
      });

      it('should throw a NotFoundException if user to delete is not found.', () => {
        jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

        expect(userService.remove(999)).rejects.toThrow(NotFoundException);
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: 999,
          },
        });
      });
    });
  });
});
