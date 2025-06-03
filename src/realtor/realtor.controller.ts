import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Realtor } from '../../generated/prisma';
import {
  FirebaseUser,
  FirebaseUserType,
} from '../common/decorators/firebase-user.decorator';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { RealtorService } from './realtor.service';

@UseGuards(FirebaseAuthGuard)
@Controller('realtors')
export class RealtorController {
  private readonly logger = new Logger(RealtorController.name);

  constructor(private readonly realtorService: RealtorService) {}

  @Post('sign-in')
  async signInRealtorController(
    @FirebaseUser() firebaseUser: FirebaseUserType,
  ): Promise<Realtor> {
    if (!firebaseUser || !firebaseUser.email) {
      throw new HttpException(
        'Email not found in authentication token.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.realtorService.signInRealtor(
      firebaseUser.email,
      firebaseUser.name,
    );
  }

  @Get('me')
  async getMyRealtor(
    @FirebaseUser() firebaseUser: FirebaseUserType,
  ): Promise<Realtor | null> {
    if (!firebaseUser || !firebaseUser.email) {
      throw new HttpException(
        'Email not found in authentication token.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.realtorService.getRealtorByEmail(firebaseUser.email);
  }
}
