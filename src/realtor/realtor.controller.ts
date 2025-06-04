import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Realtor } from '../../generated/prisma';
import {
  FirebaseUser,
  FirebaseUserType,
} from '../common/decorators/firebase-user.decorator';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { RealtorService } from './realtor.service';

// ----------------------------------------------------------------------

@UseGuards(FirebaseAuthGuard)
@Controller('realtors')
export class RealtorController {
  constructor(private readonly realtorService: RealtorService) {}

  @Get('me')
  async getMe(
    @FirebaseUser() firebaseUser: FirebaseUserType,
  ): Promise<Realtor | null> {
    return this.realtorService.findByFirebaseUid(firebaseUser.uid);
  }

  @Post('sign-in')
  async signIn(
    @FirebaseUser() firebaseUser: FirebaseUserType,
  ): Promise<Realtor> {
    return this.realtorService.signInRealtor({
      email: firebaseUser?.email ?? '',
      firebaseUid: firebaseUser.uid,
      name: firebaseUser?.name ?? '',
    });
  }
}
