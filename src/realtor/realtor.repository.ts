import { Injectable } from '@nestjs/common';
import { Prisma, Realtor } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

// ----------------------------------------------------------------------

@Injectable()
export class RealtorRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new realtor
  async create(data: Prisma.RealtorCreateInput): Promise<Realtor> {
    return this.prisma.realtor.create({ data });
  }

  // Get an active realtor by email
  async findByEmail(email: string): Promise<Realtor | null> {
    return this.prisma.realtor.findUnique({
      where: { deleted: false, email },
    });
  }

  // Get an active realtor by ID
  async findById(id: number): Promise<Realtor | null> {
    return this.prisma.realtor.findUnique({
      where: { deleted: false, id },
    });
  }

  // Update a realtor
  async update(id: number, data: Prisma.RealtorUpdateInput): Promise<Realtor> {
    return this.prisma.realtor.update({
      data,
      where: { id },
    });
  }
}
