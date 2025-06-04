import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientModule } from './client/client.module';
import { FirebaseModule } from './firebase/firebase.module';
import { GeminiModule } from './gemini/gemini.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtorModule } from './realtor/realtor.module';
import { SessionModule } from './session/session.module';
import { TeamModule } from './team/team.module';
import { UserModule } from './user/user.module';
import { WeatherModule } from './weather/weather.module';
import { WebsocketModule } from './websocket/websocket.module';

// ----------------------------------------------------------------------

@Module({
  controllers: [AppController],
  imports: [
    // Config first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database, auth modules
    FirebaseModule,
    PrismaModule,

    // Rest of modules
    ClientModule,
    GeminiModule,
    GeocodingModule,
    GoogleMapsModule,
    RealtorModule,
    SessionModule,
    TeamModule,
    UserModule,
    WeatherModule,
    WebsocketModule,
  ],
  providers: [AppService],
})
export class AppModule {}
