import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

// ----------------------------------------------------------------------

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
    @Inject('AllowedEmails') private readonly allowedEmails: string[],
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType<'http' | 'ws'>();

    let idToken: string | undefined;
    let clientOrRequest: any;

    if (type === 'ws') {
      const client = context.switchToWs().getClient();
      clientOrRequest = client;
      idToken = client.handshake.auth?.token || client.handshake.query?.token;
    } else if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      clientOrRequest = request;
      idToken = this.extractTokenFromHeader(request);
    } else {
      // For other contexts like RPC, you might need specific handling
      throw new UnauthorizedException(
        'Unsupported execution context for Firebase Auth',
      );
    }

    if (!idToken) {
      throw new UnauthorizedException('No Firebase ID token provided.');
    }

    try {
      const decodedToken = await this.firebaseAdmin
        .auth()
        .verifyIdToken(idToken);

      // Attach user to request object
      clientOrRequest.user = decodedToken;

      if (!decodedToken.email) {
        throw new UnauthorizedException('Token does not contain an email.');
      }

      if (!decodedToken.uid) {
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
