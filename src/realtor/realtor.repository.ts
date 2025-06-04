import { Injectable } from '@nestjs/common';
import { Prisma, Realtor } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

// ----------------------------------------------------------------------

@Injectable()
export class RealtorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RealtorCreateInput): Promise<Realtor> {
    return this.prisma.realtor.create({ data });
  }

  async findByEmail(email: string): Promise<Realtor | null> {
    return this.prisma.realtor.findUnique({
      where: { deleted: false, email },
    });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<Realtor | null> {
    return this.prisma.realtor.findUnique({
      where: { deleted: false, firebaseUid },
    });
  }

  async findById(id: number): Promise<Realtor | null> {
    return this.prisma.realtor.findUnique({
      where: { deleted: false, id },
    });
  }

  async update(id: number, data: Prisma.RealtorUpdateInput): Promise<Realtor> {
    return this.prisma.realtor.update({
      data,
      where: { id },
    });
  }
}
