import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TodoService } from './todo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TodoService', () => {
  let service: TodoService;
  let prisma: {
    todo: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      todo: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TodoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TodoService);
  });

  describe('findAll', () => {
    it('scopes the query by userId and orders by createdAt desc', async () => {
      prisma.todo.findMany.mockResolvedValue([]);

      await service.findAll(42);

      expect(prisma.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 42 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('persists the new todo against the supplied userId', async () => {
      prisma.todo.create.mockResolvedValue({ id: 1 });

      await service.create(7, { title: 'buy milk' });

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: { title: 'buy milk', userId: 7 },
      });
    });
  });

  describe('update', () => {
    it('updates only when the todo belongs to the user', async () => {
      prisma.todo.findFirst.mockResolvedValue({ id: 9, userId: 7 });
      prisma.todo.update.mockResolvedValue({ id: 9, title: 'edited' });

      const result = await service.update(7, 9, { title: 'edited' });

      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: { id: 9, userId: 7 },
      });
      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: { title: 'edited' },
      });
      expect(result.title).toBe('edited');
    });

    it('throws NotFoundException when the todo is owned by another user', async () => {
      prisma.todo.findFirst.mockResolvedValue(null);

      await expect(service.update(7, 9, { title: 'edited' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.todo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the todo when the user owns it', async () => {
      prisma.todo.findFirst.mockResolvedValue({ id: 9, userId: 7 });
      prisma.todo.delete.mockResolvedValue({ id: 9 });

      await service.remove(7, 9);

      expect(prisma.todo.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    });

    it('throws NotFoundException when the user does not own the todo', async () => {
      prisma.todo.findFirst.mockResolvedValue(null);

      await expect(service.remove(7, 9)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.todo.delete).not.toHaveBeenCalled();
    });
  });
});
