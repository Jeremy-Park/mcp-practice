import { Global, Module, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';

// TODO: Add jacob's email
const ALLOWED_EMAILS = ['ejejraks@gmail.com', 'jeremy.park@uniblock.dev'];

@Global()
@Module({
  providers: [
    {
      provide: 'FirebaseAdmin',
      useFactory: () => {
        const serviceAccountPath = path.join(
          __dirname,
          '..',
          'firebase-service-account-key.json',
        );
        // Log the path for debugging, in a real app, consider a more robust config management
        console.log(
          `Loading Firebase service account from: ${serviceAccountPath}`,
        );

        const serviceAccount = require(serviceAccountPath) as ServiceAccount;

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        return admin;
      },
    },
    {
      provide: 'AllowedEmails',
      useValue: ALLOWED_EMAILS,
    },
  ],
  exports: ['FirebaseAdmin', 'AllowedEmails'],
})
export class FirebaseModule implements OnModuleInit {
  constructor() {}

  async onModuleInit() {
    // This is just to ensure the factory runs and initializes Firebase Admin at startup
    // The actual admin instance is available via injection of 'FirebaseAdmin'
    console.log(
      'FirebaseModule initialized and Firebase Admin SDK configured.',
    );
  }
}
