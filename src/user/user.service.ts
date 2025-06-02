import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  test(userEmail: string): string {
    return `Firebase Auth is working! Request by: ${userEmail}`;
  }
} 