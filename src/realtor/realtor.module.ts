import { Module } from '@nestjs/common';
import { RealtorController } from './realtor.controller';
import { RealtorRepository } from './realtor.repository';
import { RealtorService } from './realtor.service';

// ----------------------------------------------------------------------

@Module({
  imports: [],
  controllers: [RealtorController],
  providers: [RealtorService, RealtorRepository],
  exports: [RealtorService],
})
export class RealtorModule {}
