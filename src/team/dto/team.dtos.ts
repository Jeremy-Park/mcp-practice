// import {
//   IsNotEmpty,
//   IsString,
//   MaxLength,
//   IsOptional,
//   IsEmail,
//   IsEnum,
//   IsInt
// } from 'class-validator';
// import { TeamRole } from '../../../generated/prisma';

// export class CreateTeamDto {
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(100)
//   name: string;
// }

// export class UpdateTeamDto {
//   @IsString()
//   @IsOptional()
//   @MaxLength(100)
//   name?: string;
// }

// export class InviteRealtorDto {
//   @IsEmail()
//   @IsNotEmpty()
//   realtorEmail: string;

//   @IsEnum(TeamRole)
//   @IsOptional()
//   role?: TeamRole = TeamRole.MEMBER;
// }

// export class UpdateTeamMemberRoleDto {
//   @IsInt()
//   @IsNotEmpty()
//   realtorId: number;

//   @IsEnum(TeamRole)
//   @IsNotEmpty()
//   role: TeamRole;
// } 