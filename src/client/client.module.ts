import { Module } from '@nestjs/common';
import { RealtorModule } from '../realtor/realtor.module';
import { TeamModule } from '../team/team.module';
import { ClientRepository } from './client.repository';
import { ClientService } from './client.service';

// ----------------------------------------------------------------------

@Module({
  imports: [RealtorModule, TeamModule],
  providers: [ClientService, ClientRepository],
  exports: [ClientService],
})
export class ClientModule {}
