import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
    @Inject('AllowedEmails') private readonly allowedEmails: string[],
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idToken = this.extractTokenFromHeader(request);

    if (!idToken) {
      throw new UnauthorizedException('No Firebase ID token provided.');
    }

    try {
      const decodedToken = await this.firebaseAdmin
        .auth()
        .verifyIdToken(idToken);
      request.user = decodedToken; // Attach user to request object

      if (!decodedToken.email) {
        throw new UnauthorizedException('Token does not contain an email.');
      }

      if (!this.allowedEmails.includes(decodedToken.email)) {
        console.warn(
          `Unauthorized access attempt by email: ${decodedToken.email}`,
        );
        throw new UnauthorizedException(
          'User email not authorized for this application.',
        );
      }

      console.log(`Authorized access for email: ${decodedToken.email}`);
      return true;
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw our specific unauthorized exceptions
      }
      throw new UnauthorizedException(
        'Invalid Firebase ID token or user not authorized.',
      );
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
