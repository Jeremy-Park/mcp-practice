// import {
//   IsString,
//   IsNotEmpty,
//   IsOptional,
//   IsEmail,
//   IsEnum,
//   MaxLength,
//   IsPhoneNumber
// } from 'class-validator';
// import { ClientStatus } from '../../../generated/prisma';

// ----------------------------------------------------------------------

// export class CreateClientDto {
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(100)
//   firstName: string;

//   @IsString()
//   @IsOptional()
//   @MaxLength(100)
//   middleName?: string;

//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(100)
//   lastName: string;

//   @IsEmail()
//   @IsOptional()
//   email?: string;

//   @IsPhoneNumber(undefined) // Allow any valid international phone number
//   @IsOptional()
//   phone?: string;

//   @IsEnum(ClientStatus)
//   @IsOptional()
//   status?: ClientStatus = ClientStatus.NEW;
// }

// export class UpdateClientDto {
//   @IsString()
//   @IsOptional()
//   @MaxLength(100)
//   firstName?: string;

//   @IsString()
//   @IsOptional()
//   @MaxLength(100)
//   middleName?: string;

//   @IsString()
//   @IsOptional()
//   @MaxLength(100)
//   lastName?: string;

//   @IsEmail()
//   @IsOptional()
//   email?: string;

//   @IsPhoneNumber(undefined) // Allow any valid international phone number
//   @IsOptional()
//   phone?: string;

//   @IsEnum(ClientStatus)
//   @IsOptional()
//   status?: ClientStatus;
// }
