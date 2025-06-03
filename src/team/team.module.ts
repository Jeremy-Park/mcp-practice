import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamRepository } from './team.repository';
import { RealtorModule } from '../realtor/realtor.module'; // Import RealtorModule as TeamService depends on RealtorService

@Module({
  imports: [RealtorModule], // TeamService needs RealtorService
  providers: [TeamService, TeamRepository],
  exports: [TeamService],
  // We will add TeamController here later if needed
})
export class TeamModule {} 