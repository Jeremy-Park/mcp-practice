import { Module } from '@nestjs/common';
import { RealtorService } from './realtor.service';
import { RealtorRepository } from './realtor.repository';
import { RealtorController } from './realtor.controller';
// We will add RealtorController here later if needed

@Module({
  imports: [], // PrismaModule is global, so no need to import here
  controllers: [RealtorController],
  providers: [RealtorService, RealtorRepository],
  exports: [RealtorService], // Export service for use in other modules (e.g., TeamModule)
})
export class RealtorModule {} 