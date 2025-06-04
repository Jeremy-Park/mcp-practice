import { Module } from '@nestjs/common';
import { RealtorModule } from '../realtor/realtor.module';
import { TeamRepository } from './team.repository';
import { TeamService } from './team.service';

// ----------------------------------------------------------------------

@Module({
  imports: [RealtorModule],
  providers: [TeamRepository, TeamService],
  exports: [TeamService],
})
export class TeamModule {}
