import { Injectable } from '@nestjs/common';
import { RealtorService } from '../realtor/realtor.service';
import { TeamService } from '../team/team.service';
import { ClientRepository } from './client.repository';

// ----------------------------------------------------------------------

@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly teamService: TeamService,
    private readonly realtorService: RealtorService,
  ) {}

  // async createClient(
  //   createClientDto: CreateClientDto,
  //   // We might add creatingRealtorId if we want to log who created the client,
  //   // but clients are not directly owned by realtors, but by teams.
  // ): Promise<Client> {
  //   // Basic creation, client is not assigned to any team initially by this method.
  //   // Assignment happens via assignClientToTeam.
  //   return this.clientRepository.create(createClientDto);
  // }

  // async getClientById(
  //   clientId: number,
  //   requestingRealtorId: number,
  // ): Promise<Client> {
  //   const client = await this.clientRepository.findById(clientId);
  //   if (!client) {
  //     throw new NotFoundException(`Client with ID ${clientId} not found`);
  //   }

  //   // Check if the requesting realtor has access to this client through any team
  //   const teamsOfRealtor = await this.teamService.getTeamsForRealtor(requestingRealtorId);
  //   const clientIsAccessible = client.teams.some(tc =>
  //       teamsOfRealtor.some(tr => tr.teamId === tc.teamId)
  //   );

  //   if (!client.teams.length) { // If client is not on any team, is it accessible?
  //       // Business rule: For now, let's assume unassigned clients are not directly viewable
  //       // unless a specific role or permission allows it. Or maybe only by an admin.
  //       // This can be adjusted based on requirements.
  //       throw new ForbiddenException('This client is not assigned to any of your teams.');
  //   }

  //   if (!clientIsAccessible) {
  //     throw new ForbiddenException(
  //       'You do not have access to this client through any of your teams.',
  //     );
  //   }
  //   return client;
  // }

  // async getAllClientsForRealtor(requestingRealtorId: number): Promise<Client[]> {
  //   await this.realtorService.getRealtorById(requestingRealtorId);
  //   const teamsOfRealtor = await this.teamService.getTeamsForRealtor(requestingRealtorId);
  //   if (!teamsOfRealtor.length) {
  //       return []; // Realtor is not on any team, so no clients to show
  //   }
  //   const teamIds = teamsOfRealtor.map(tr => tr.teamId);

  //   // This will fetch all clients that are part of any of the realtor's teams.
  //   // We need a repository method for this or adapt findAll.
  //   // For now, let's get all clients and filter. This is not efficient for large datasets.
  //   // A better approach is a dedicated repository method.
  //   const allClients = await this.clientRepository.findAll(); // FindAll without teamId gets all non-deleted clients
  //   return allClients.filter(client =>
  //       client.teams.some(tc => teamIds.includes(tc.teamId))
  //   );
  // }

  // async getClientsByTeamId(
  //   teamId: number,
  //   requestingRealtorId: number,
  // ): Promise<Client[]> {
  //   // Ensure realtor is part of the team they are requesting clients for
  //   await this.teamService.getTeamById(teamId, requestingRealtorId); // This also checks team existence
  //   const teamClients = await this.clientRepository.findClientsByTeamId(teamId);
  //   return teamClients.map(tc => tc.client);
  // }

  // async updateClient(
  //   clientId: number,
  //   updateClientDto: UpdateClientDto,
  //   requestingRealtorId: number,
  // ): Promise<Client> {
  //   // Ensure client exists and realtor has access
  //   await this.getClientById(clientId, requestingRealtorId);
  //   // TODO: Add more granular permission check if needed (e.g., only certain roles can update)
  //   return this.clientRepository.update(clientId, updateClientDto);
  // }

  // async deleteClient(
  //   clientId: number,
  //   requestingRealtorId: number,
  // ): Promise<Client> {
  //   // Ensure client exists and realtor has access to at least one team the client is on.
  //   const client = await this.getClientById(clientId, requestingRealtorId);
  //   // TODO: More granular permission check. Who can delete a client?
  //   // For now, if a realtor can view the client (is on a shared team), they can delete.
  //   // This implies the client will be soft-deleted but TeamClient entries might need cleanup or handling.
  //   // The current soft delete on client just marks the client. TeamClient entries remain.
  //   return this.clientRepository.softDelete(client.id);
  // }

  // async assignClientToTeam(
  //   clientId: number,
  //   teamId: number,
  //   requestingRealtorId: number,
  // ): Promise<TeamClient> {
  //   // Ensure client exists
  //   const client = await this.clientRepository.findById(clientId);
  //   if (!client) {
  //     throw new NotFoundException(`Client with ID ${clientId} not found`);
  //   }

  //   // Ensure team exists and realtor is a member of that team
  //   await this.teamService.getTeamById(teamId, requestingRealtorId);

  //   const existingAssignment = await this.clientRepository.findTeamClientAssignment(clientId, teamId);
  //   if (existingAssignment) {
  //     throw new ConflictException(`Client ${clientId} is already assigned to team ${teamId}`);
  //   }

  //   return this.clientRepository.assignClientToTeam(clientId, teamId);
  // }

  // async removeClientFromTeam(
  //   clientId: number,
  //   teamId: number,
  //   requestingRealtorId: number,
  // ): Promise<TeamClient> {
  //   // Ensure client exists
  //   const client = await this.clientRepository.findById(clientId);
  //   if (!client) {
  //     throw new NotFoundException(`Client with ID ${clientId} not found`);
  //   }

  //   // Ensure team exists and realtor is a member of that team
  //   // (and potentially has permission to remove clients - e.g., owner)
  //   await this.teamService.getTeamById(teamId, requestingRealtorId);
  //   // For now, any member of the team can remove a client from their team.
  //   // TODO: Add role-based permission if needed (e.g., only team owners can remove clients).

  //   const assignment = await this.clientRepository.findTeamClientAssignment(clientId, teamId);
  //   if (!assignment) {
  //     throw new NotFoundException(
  //       `Client ${clientId} is not assigned to team ${teamId}`,
  //     );
  //   }
  //   return this.clientRepository.removeClientFromTeam(clientId, teamId);
  // }
}
