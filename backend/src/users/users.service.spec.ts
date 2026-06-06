import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  it('findByEmail delegates to prisma with email filter', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@example.com' });

    const result = await service.findByEmail('a@example.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@example.com' },
    });
    expect(result).toEqual({ id: 1, email: 'a@example.com' });
  });

  it('findById delegates to prisma with id filter', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 7, email: 'b@example.com' });

    const result = await service.findById(7);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result?.id).toBe(7);
  });

  it('create stores email and passwordHash verbatim', async () => {
    prisma.user.create.mockResolvedValue({
      id: 10,
      email: 'c@example.com',
      passwordHash: 'hashed',
    });

    await service.create('c@example.com', 'hashed');

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'c@example.com', passwordHash: 'hashed' },
    });
  });
});
