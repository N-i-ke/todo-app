import { Injectable, NotFoundException } from '@nestjs/common';
import { Todo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({
      data: { title: dto.title },
    });
  }

  async update(id: number, dto: UpdateTodoDto): Promise<Todo> {
    await this.ensureExists(id);
    return this.prisma.todo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<Todo> {
    await this.ensureExists(id);
    return this.prisma.todo.delete({ where: { id } });
  }

  private async ensureExists(id: number): Promise<void> {
    const found = await this.prisma.todo.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
  }
}
