import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the Firebase user object from the request.
 * Assumes that a guard (like FirebaseAuthGuard) has already populated `req.user`.
 */
export const FirebaseUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // The Firebase user object attached by FirebaseAuthGuard
  },
);

/**
 * Interface for the Firebase user object (you might want to expand this based on your needs).
 * This is a minimal version based on what Firebase Admin SDK typically provides after token verification.
 */
export interface FirebaseUserType {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  // Add other fields from the decoded Firebase token as needed
} 