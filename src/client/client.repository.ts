import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// type ClientWithTeamsPayload = Prisma.ClientGetPayload<{
//   include: { teams: { include: { team: true } } }
// }>;

// type TeamClientWithClientPayload = Prisma.TeamClientGetPayload<{
//   include: { client: true }
// }>;

@Injectable()
export class ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  // async create(data: Prisma.ClientCreateInput): Promise<Client> {
  //   return this.prisma.client.create({ data });
  // }

  // async findById(id: number): Promise<ClientWithTeamsPayload | null> {
  //   return this.prisma.client.findUnique({
  //     where: { id, deleted: false },
  //     include: { teams: { where: { team: { deleted: false }}, include: { team: true } } },
  //   });
  // }

  // async findAll(teamId?: number): Promise<ClientWithTeamsPayload[]> {
  //   const whereClause: Prisma.ClientWhereInput = { deleted: false };
  //   if (teamId) {
  //     whereClause.teams = {
  //       some: {
  //         teamId: teamId,
  //         team: { deleted: false }
  //       }
  //     }
  //   }
  //   return this.prisma.client.findMany({
  //     where: whereClause,
  //     include: { teams: { where: { team: {deleted: false}}, include: { team: true } } }
  //   });
  // }

  // async update(id: number, data: Prisma.ClientUpdateInput): Promise<Client> {
  //   return this.prisma.client.update({
  //     where: { id, deleted: false },
  //     data,
  //   });
  // }

  // async softDelete(id: number): Promise<Client> {
  //   return this.prisma.client.update({
  //     where: { id },
  //     data: { deleted: true },
  //   });
  // }

  // // Methods for TeamClient relationships
  // async assignClientToTeam(clientId: number, teamId: number): Promise<TeamClient> {
  //   return this.prisma.teamClient.create({
  //     data: {
  //       clientId,
  //       teamId,
  //     },
  //   });
  // }

  // async findTeamClientAssignment(clientId: number, teamId: number): Promise<TeamClient | null> {
  //   return this.prisma.teamClient.findUnique({
  //     where: {
  //       teamId_clientId: { teamId, clientId },
  //       team: { deleted: false },
  //       client: { deleted: false }
  //     }
  //   });
  // }

  // async removeClientFromTeam(clientId: number, teamId: number): Promise<TeamClient> {
  //   return this.prisma.teamClient.delete({
  //     where: {
  //       teamId_clientId: { teamId, clientId },
  //     },
  //   });
  // }

  // async findClientsByTeamId(teamId: number): Promise<TeamClientWithClientPayload[]> {
  //   return this.prisma.teamClient.findMany({
  //     where: {
  //       teamId,
  //       team: { deleted: false },
  //       client: { deleted: false }
  //     },
  //     include: { client: true },
  //   });
  // }

  // async findTeamsByClientId(clientId: number): Promise<Prisma.TeamClientGetPayload<{include: {team: true}}>[]> {
  //   return this.prisma.teamClient.findMany({
  //     where: {
  //       clientId,
  //       client: { deleted: false },
  //       team: { deleted: false }
  //     },
  //     include: { team: true },
  //   });
  // }
}
