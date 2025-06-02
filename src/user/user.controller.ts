import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard'; // Adjusted path

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('test')
  @UseGuards(FirebaseAuthGuard)
  testAuth(@Request() req): string {
    // req.user is populated by FirebaseAuthGuard
    const userEmail = req.user?.email || 'Unknown User';
    return this.userService.test(userEmail);
  }
} 