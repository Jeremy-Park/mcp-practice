import { Module } from '@nestjs/common';
import { JikanModule } from 'src/jikan/jikan.module';
import { RealtorModule } from 'src/realtor/realtor.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { GeminiModule } from '../gemini/gemini.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { GoogleMapsModule } from '../google-maps/google-maps.module';
import { SessionModule } from '../session/session.module';
import { WeatherModule } from '../weather/weather.module';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';

// ----------------------------------------------------------------------

@Module({
  imports: [
    FirebaseModule,
    GeminiModule,
    GeocodingModule,
    GoogleMapsModule,
    JikanModule,
    RealtorModule,
    SessionModule,
    WeatherModule,
  ],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}
