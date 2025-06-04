import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// ----------------------------------------------------------------------

// FirebaseAuthGuard populates `req.user` with the Firebase user object
// This decorator extracts the user object from the request
// This can only be used for HTTP requests, not websockets
export const FirebaseUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Interface for the Firebase user object
// Simplified object based on what Firebase Admin SDK provides
export interface FirebaseUserType {
  email?: string;
  name?: string;
  picture?: string;
  uid: string;
}
