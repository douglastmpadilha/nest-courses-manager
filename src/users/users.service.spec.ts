import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      };
      const hashedPassword = 'hashedpassword123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const savedUser = { id: 1, ...userData, password: hashedPassword };

      mockPrismaService.user.create.mockResolvedValue(savedUser);

      const result = await service.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(savedUser);
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      const userId = '1';
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        email: 'test@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = '999';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
