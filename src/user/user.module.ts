import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
// FirebaseModule is already global, so no need to import it here directly
// unless you had specific providers from it that weren't global.

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {} 