import { Injectable, NotFoundException } from '@nestjs/common';
import { Todo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: number, dto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({
      data: { title: dto.title, userId },
    });
  }

  async update(userId: number, id: number, dto: UpdateTodoDto): Promise<Todo> {
    await this.ensureOwned(userId, id);
    return this.prisma.todo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: number, id: number): Promise<Todo> {
    await this.ensureOwned(userId, id);
    return this.prisma.todo.delete({ where: { id } });
  }

  private async ensureOwned(userId: number, id: number): Promise<void> {
    const found = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!found) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
  }
}
