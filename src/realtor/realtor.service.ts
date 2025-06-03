import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Realtor } from '../../generated/prisma';
import { RealtorRepository } from './realtor.repository';

@Injectable()
export class RealtorService {
  constructor(private readonly realtorRepository: RealtorRepository) {}

  async getRealtorByEmail(email: string): Promise<Realtor | null> {
    const realtor = await this.realtorRepository.findByEmail(email);

    if (!realtor) {
      throw new NotFoundException(`Realtor with email ${email} not found`);
    }

    return realtor;
  }

  // Create a new realtor if they don't exist, otherwise return the existing realtor
  async signInRealtor(email: string, name?: string): Promise<Realtor> {
    // Check if the realtor exists
    let realtor = await this.realtorRepository.findByEmail(email);

    if (!realtor) {
      // If the realtor doesn't exist, create a new one
      const createData: Prisma.RealtorCreateInput = { email };
      if (name) {
        createData.name = name;
      }
      realtor = await this.realtorRepository.create(createData);
    }

    return realtor;
  }

  async updateRealtorName(email: string, name: string): Promise<Realtor> {
    const realtor = await this.realtorRepository.findByEmail(email); // Ensures realtor exists
    if (!realtor) {
      throw new NotFoundException(`Realtor with email ${email} not found`);
    }

    return this.realtorRepository.update(realtor.id, { name });
  }

  async updateRealtorEmail(email: string, newEmail: string): Promise<Realtor> {
    const realtor = await this.realtorRepository.findByEmail(email); // Ensures realtor exists

    if (!realtor) {
      throw new NotFoundException(`Realtor with email ${email} not found`);
    }

    return this.realtorRepository.update(realtor.id, { email: newEmail });
  }
}
