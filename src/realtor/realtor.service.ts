import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Realtor } from '../../generated/prisma';
import { RealtorRepository } from './realtor.repository';

// ----------------------------------------------------------------------

@Injectable()
export class RealtorService {
  constructor(private readonly realtorRepository: RealtorRepository) {}

  async findByEmail(email: string): Promise<Realtor> {
    const realtor = await this.realtorRepository.findByEmail(email);

    if (!realtor) {
      throw new NotFoundException(`Realtor not found`);
    }

    return realtor;
  }

  async findById(id: number): Promise<Realtor> {
    const realtor = await this.realtorRepository.findById(id);

    if (!realtor) {
      throw new NotFoundException(`Realtor not found`);
    }

    return realtor;
  }

  // Auto-create realtor object for signed in users
  async signInRealtor(email: string, name?: string): Promise<Realtor> {
    // Check if the realtor exists
    const realtor = await this.realtorRepository.findByEmail(email);

    if (realtor) {
      return realtor;
    }

    // If the realtor doesn't exist, create a new one
    const createData: Prisma.RealtorCreateInput = { email };

    if (name) {
      createData.name = name;
    }

    const newRealtor = await this.realtorRepository.create(createData);
    return newRealtor;
  }

  async updateRealtorEmail(id: number, email: string): Promise<Realtor> {
    const realtor = await this.realtorRepository.findById(id);

    if (!realtor) {
      throw new NotFoundException(`Realtor not found`);
    }

    return this.realtorRepository.update(id, { email });
  }

  async updateRealtorName(id: number, name: string): Promise<Realtor> {
    const realtor = await this.realtorRepository.findById(id);

    if (!realtor) {
      throw new NotFoundException(`Realtor not found`);
    }

    return this.realtorRepository.update(id, { name });
  }
}
