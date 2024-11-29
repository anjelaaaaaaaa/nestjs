import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { describe } from 'node:test';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  const mockedUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockedUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '123123',
      };

      const user = {
        id: 1,
        ...createUserDto,
        password: 'asdf',
      };

      jest.spyOn(userService, 'create').mockResolvedValue(user as User);

      const result = await userController.create(createUserDto);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const users = [
        {
          id: 1,
          email: 'abc',
          password: 'ab',
        },
        {
          id: 1,
          email: 'abc',
          password: 'ab',
        },
      ];
      jest.spyOn(userService, 'findAll').mockResolvedValue(users as User[]);

      const result = await userController.findAll();
      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const id = 1;
      const user = {
        id: 1,
        email: 'abc',
        password: '123',
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(user as User);

      const result = await userController.findOne(id);
      expect(userService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should return the updated user', async () => {
      const id = 1;
      const updateUserDto: UpdateUserDto = {
        email: 'abc',
      };

      const user = {
        id: 1,
        ...updateUserDto,
      };

      jest.spyOn(userService, 'update').mockResolvedValue(user as User);

      const result = await userController.update(id, updateUserDto);
      expect(userService.update).toHaveBeenCalledWith(id, updateUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should delete user if user exists', async () => {
      const id = 1;

      jest.spyOn(userService, 'remove').mockResolvedValue(id);

      const result = await userController.remove(id);
      expect(userService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);
    });
  });
});
