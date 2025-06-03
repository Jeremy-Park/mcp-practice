import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Realtor } from '../../generated/prisma';

@Injectable()
export class RealtorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RealtorCreateInput): Promise<Realtor> {
    return this.prisma.realtor.create({ data });
  }

  async update(id: number, data: Prisma.RealtorUpdateInput): Promise<Realtor> {
    return this.prisma.realtor.update({
      where: { id },
      data,
    });
  }

  async findByEmail(email: string): Promise<Realtor | null> {
    return this.prisma.realtor.findUnique({
      where: { email, deleted: false },
    });
  }
}
