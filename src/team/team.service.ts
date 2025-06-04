import { Injectable } from '@nestjs/common';
import { RealtorService } from '../realtor/realtor.service';
import { TeamRepository } from './team.repository';

// ----------------------------------------------------------------------

@Injectable()
export class TeamService {
  constructor(
    private readonly realtorService: RealtorService,
    private readonly teamRepository: TeamRepository,
  ) {}

  // async createTeam(
  //   createTeamDto: CreateTeamDto,
  //   creatorRealtorId: number,
  // ): Promise<Team> {
  //   // Ensure the creator realtor exists
  //   await this.realtorService.getRealtorById(creatorRealtorId);
  //   // The repository's create method handles adding the creator as an OWNER in a transaction
  //   return this.teamRepository.create(
  //     { name: createTeamDto.name },
  //     creatorRealtorId,
  //   );
  // }

  // async getTeamById(teamId: number, requestingRealtorId: number): Promise<Team> {
  //   const team = await this.teamRepository.findById(teamId);
  //   if (!team) {
  //     throw new NotFoundException(`Team with ID ${teamId} not found`);
  //   }

  //   // Check if the requesting realtor is a member of this team
  //   const member = await this.teamRepository.findTeamMember(teamId, requestingRealtorId);
  //   if (!member) {
  //     throw new ForbiddenException(
  //       'You are not a member of this team and cannot view its details.',
  //     );
  //   }
  //   return team; // The repository already includes members with realtor details
  // }

  // async getTeamMembers(teamId: number, requestingRealtorId: number): Promise<TeamRealtor[]> {
  //   // First, ensure the team exists and the user is a member (authorization)
  //   await this.getTeamById(teamId, requestingRealtorId);
  //   return this.teamRepository.findTeamMembers(teamId);
  // }

  // async updateTeamInfo(
  //   teamId: number,
  //   updateTeamDto: UpdateTeamDto,
  //   requestingRealtorId: number,
  // ): Promise<Team> {
  //   await this.ensureRealtorIsOwner(teamId, requestingRealtorId);
  //   return this.teamRepository.update(teamId, updateTeamDto);
  // }

  // async deleteTeam(teamId: number, requestingRealtorId: number): Promise<Team> {
  //   await this.ensureRealtorIsOwner(teamId, requestingRealtorId);
  //   // Ensure there's at least one other owner if this owner is deleting?
  //   // For now, allow deletion by any owner. Business rule: Only owners of the team can delete the team.
  //   return this.teamRepository.softDelete(teamId);
  // }

  // async inviteRealtorToTeam(
  //   teamId: number,
  //   inviteDto: InviteRealtorDto,
  //   invitingRealtorId: number,
  // ): Promise<TeamRealtor> {
  //   await this.ensureRealtorIsOwner(teamId, invitingRealtorId);

  //   const realtorToInvite = await this.realtorService.findRealtorByEmail(
  //     inviteDto.realtorEmail,
  //   );
  //   if (!realtorToInvite) {
  //     // Option: automatically create a realtor record if they don't exist?
  //     // For now, assume realtor must exist in the system to be invited.
  //     throw new NotFoundException(
  //       `Realtor with email ${inviteDto.realtorEmail} not found.`,
  //     );
  //   }

  //   const existingMember = await this.teamRepository.findTeamMember(
  //     teamId,
  //     realtorToInvite.id,
  //   );
  //   if (existingMember) {
  //     throw new ConflictException(
  //       `Realtor ${realtorToInvite.email} is already a member of this team.`,
  //     );
  //   }

  //   return this.teamRepository.addRealtorToTeam(
  //     teamId,
  //     realtorToInvite.id,
  //     inviteDto.role || TeamRole.MEMBER, // Default to MEMBER if not specified in DTO
  //   );
  // }

  // async removeRealtorFromTeam(
  //   teamId: number,
  //   realtorIdToRemove: number,
  //   requestingRealtorId: number,
  // ): Promise<TeamRealtor> {
  //   await this.ensureRealtorIsOwner(teamId, requestingRealtorId);

  //   if (realtorIdToRemove === requestingRealtorId) {
  //     throw new ForbiddenException('Owners cannot remove themselves directly. Use \'transfer ownership\' or \'leave team\' feature instead.');
  //     // Or, if they are the only owner, prevent removal.
  //   }

  //   const memberToRemove = await this.teamRepository.findTeamMember(
  //     teamId,
  //     realtorIdToRemove,
  //   );
  //   if (!memberToRemove) {
  //     throw new NotFoundException(
  //       `Realtor with ID ${realtorIdToRemove} is not a member of this team.`,
  //     );
  //   }

  //   // Prevent removing the last owner
  //   if (memberToRemove.role === TeamRole.OWNER) {
  //       const teamMembers = await this.teamRepository.findTeamMembers(teamId);
  //       const owners = teamMembers.filter(m => m.role === TeamRole.OWNER);
  //       if (owners.length === 1) {
  //           throw new ForbiddenException('Cannot remove the last owner of the team.');
  //       }
  //   }

  //   return this.teamRepository.removeRealtorFromTeam(teamId, realtorIdToRemove);
  // }

  // async updateTeamMemberRole(
  //   teamId: number,
  //   updateRoleDto: UpdateTeamMemberRoleDto,
  //   requestingRealtorId: number,
  // ): Promise<TeamRealtor> {
  //   await this.ensureRealtorIsOwner(teamId, requestingRealtorId);

  //   const memberToUpdate = await this.teamRepository.findTeamMember(
  //     teamId,
  //     updateRoleDto.realtorId,
  //   );

  //   if (!memberToUpdate) {
  //     throw new NotFoundException(
  //       `Realtor with ID ${updateRoleDto.realtorId} is not a member of this team.`,
  //     );
  //   }

  //   // If changing an owner to a member, ensure there's at least one other owner left.
  //   if (
  //     memberToUpdate.role === TeamRole.OWNER &&
  //     updateRoleDto.role === TeamRole.MEMBER
  //   ) {
  //     if (memberToUpdate.realtorId === requestingRealtorId && updateRoleDto.realtorId === requestingRealtorId) {
  //       // Owner trying to demote themselves
  //       const teamMembers = await this.teamRepository.findTeamMembers(teamId);
  //       const owners = teamMembers.filter((m) => m.role === TeamRole.OWNER);
  //       if (owners.length === 1) {
  //         throw new ForbiddenException(
  //           'Cannot demote the last owner. Transfer ownership first.',
  //         );
  //       }
  //     } else if (updateRoleDto.realtorId !== requestingRealtorId) {
  //       // Owner demoting another owner
  //       const teamMembers = await this.teamRepository.findTeamMembers(teamId);
  //       const owners = teamMembers.filter((m) => m.role === TeamRole.OWNER && m.realtorId !== updateRoleDto.realtorId);
  //       if (owners.length === 0) { // Check if there are other owners excluding the one being demoted
  //            throw new ForbiddenException(
  //           'Cannot demote this owner as they are the only other owner. Transfer ownership first or promote another member.',
  //         );
  //       }
  //     }
  //   }

  //   // Prevent making a team have no owners if the only owner is being demoted by themselves.
  //   // This specific check for self-demotion to last owner is covered above.
  //   // General check: if target role is not owner and current user is the one being updated and is the last owner.
  //   if (updateRoleDto.realtorId === requestingRealtorId &&
  //       memberToUpdate.role === TeamRole.OWNER &&
  //       updateRoleDto.role !== TeamRole.OWNER) {
  //       const teamMembers = await this.teamRepository.findTeamMembers(teamId);
  //       const owners = teamMembers.filter(m => m.role === TeamRole.OWNER);
  //       if (owners.length === 1 && owners[0].realtorId === requestingRealtorId) {
  //           throw new ForbiddenException('You are the last owner and cannot change your role to non-owner. Transfer ownership first.');
  //       }
  //   }

  //   return this.teamRepository.updateRealtorRoleInTeam(
  //     teamId,
  //     updateRoleDto.realtorId,
  //     updateRoleDto.role,
  //   );
  // }

  // // Helper method for authorization
  // private async ensureRealtorIsOwner(
  //   teamId: number,
  //   realtorId: number,
  // ): Promise<void> {
  //   const team = await this.teamRepository.findById(teamId);
  //   if (!team) {
  //     throw new NotFoundException(`Team with ID ${teamId} not found`);
  //   }

  //   const member = await this.teamRepository.findTeamMember(teamId, realtorId);
  //   if (!member) {
  //     throw new ForbiddenException(
  //       `Realtor with ID ${realtorId} is not a member of this team.`,
  //     );
  //   }

  //   if (member.role !== TeamRole.OWNER) {
  //     throw new ForbiddenException(
  //       'You must be an owner of this team to perform this action.',
  //     );
  //   }
  // }

  // async getTeamsForRealtor(realtorId: number): Promise<TeamRealtor[]> {
  //   await this.realtorService.getRealtorById(realtorId); // Ensure realtor exists
  //   return this.teamRepository.findTeamsByRealtorId(realtorId);
  // }
}
