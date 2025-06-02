import { Global, Module, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';

// TODO: Add jacob's email
const ALLOWED_EMAILS = [
  'ejejraks@gmail.com',
  'jeremy.park@uniblock.dev',
  'yooshjp1@gmail.com',
];

@Global()
@Module({
  providers: [
    {
      provide: 'FirebaseAdmin',
      useFactory: () => {
        const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        let serviceAccount: ServiceAccount;

        if (firebaseServiceAccountJson) {
          console.log('Loading Firebase service account from environment variable.');
          try {
            serviceAccount = JSON.parse(firebaseServiceAccountJson);
          } catch (error) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
          }
        } else {
          console.warn(
            'FIREBASE_SERVICE_ACCOUNT_JSON environment variable not found. Falling back to local file.',
          );
          const serviceAccountPath = path.join(
            process.cwd(),
            'firebase-service-account-key.json',
          );
          console.log(
            `Loading Firebase service account from: ${serviceAccountPath}`,
          );
          try {
            serviceAccount = require(serviceAccountPath) as ServiceAccount;
          } catch (error) {
            console.error(`Failed to load service account from ${serviceAccountPath}:`, error);
            throw new Error(
              `Could not load Firebase service account. Ensure firebase-service-account-key.json is in the root or FIREBASE_SERVICE_ACCOUNT_JSON is set.`,
            );
          }
        }

        if (admin.apps.length === 0) { // Initialize only if no apps are present
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
          console.warn('Firebase app already initialized. Skipping initialization.');
        }
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
