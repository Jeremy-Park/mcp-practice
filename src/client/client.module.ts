import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientRepository } from './client.repository';
import { TeamModule } from '../team/team.module';
import { RealtorModule } from '../realtor/realtor.module';

@Module({
  imports: [
    TeamModule, // For TeamService dependency in ClientService
    RealtorModule, // For RealtorService dependency in ClientService
  ],
  providers: [ClientService, ClientRepository],
  exports: [ClientService],
  // We will add ClientController here later if needed
})
export class ClientModule {} 