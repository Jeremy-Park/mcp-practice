import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { Prisma, Team, TeamRealtor, TeamRole } from '../../generated/prisma';

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  // async create(data: Prisma.TeamCreateInput, ownerId: number): Promise<Team> {
  //   return this.prisma.$transaction(async (tx) => {
  //     const team = await tx.team.create({
  //       data,
  //     });

  //     await tx.teamRealtor.create({
  //       data: {
  //         teamId: team.id,
  //         realtorId: ownerId,
  //         role: TeamRole.OWNER,
  //       },
  //     });

  //     return team;
  //   });
  // }

  // async findById(id: number): Promise<Team | null> {
  //   return this.prisma.team.findUnique({
  //     where: { id, deleted: false },
  //     include: { realtors: { include: { realtor: true } } }, // Optionally include members
  //   });
  // }

  // async findAll(): Promise<Team[]> {
  //   return this.prisma.team.findMany({
  //     where: { deleted: false },
  //     include: { realtors: { include: { realtor: true } } }, // Optionally include members
  //   });
  // }

  // async update(id: number, data: Prisma.TeamUpdateInput): Promise<Team> {
  //   return this.prisma.team.update({
  //     where: { id, deleted: false }, // Ensure we don't update a deleted team
  //     data,
  //   });
  // }

  // async softDelete(id: number): Promise<Team> {
  //   return this.prisma.team.update({
  //     where: { id },
  //     data: { deleted: true },
  //   });
  // }

  // async addRealtorToTeam(
  //   teamId: number,
  //   realtorId: number,
  //   role: TeamRole,
  // ): Promise<TeamRealtor> {
  //   return this.prisma.teamRealtor.create({
  //     data: {
  //       teamId,
  //       realtorId,
  //       role,
  //     },
  //   });
  // }

  // async findTeamMember(
  //   teamId: number,
  //   realtorId: number,
  // ): Promise<TeamRealtor | null> {
  //   return this.prisma.teamRealtor.findUnique({
  //     where: {
  //       teamId_realtorId: { teamId, realtorId },
  //       team: { deleted: false } // Ensure realtor is part of an active team
  //     },
  //     include: { realtor: true, team: true }
  //   });
  // }

  // async removeRealtorFromTeam(
  //   teamId: number,
  //   realtorId: number,
  // ): Promise<TeamRealtor> {
  //   return this.prisma.teamRealtor.delete({
  //     where: {
  //       teamId_realtorId: { teamId, realtorId },
  //     },
  //   });
  // }

  // async updateRealtorRoleInTeam(
  //   teamId: number,
  //   realtorId: number,
  //   role: TeamRole,
  // ): Promise<TeamRealtor> {
  //   return this.prisma.teamRealtor.update({
  //     where: {
  //       teamId_realtorId: { teamId, realtorId },
  //     },
  //     data: {
  //       role,
  //     },
  //   });
  // }

  // async findTeamMembers(teamId: number): Promise<TeamRealtor[]> {
  //   return this.prisma.teamRealtor.findMany({
  //     where: {
  //       teamId,
  //       team: { deleted: false }
  //     },
  //     include: {
  //       realtor: { select: { id: true, email: true, name: true } }, // Select specific realtor fields
  //     },
  //   });
  // }

  // async findTeamsByRealtorId(realtorId: number): Promise<TeamRealtor[]> {
  //   return this.prisma.teamRealtor.findMany({
  //     where: { realtorId: realtorId, team: { deleted: false } },
  //     include: { team: true }, // Include the full team object
  //   });
  // }
}
