import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { GeminiModule } from '../gemini/gemini.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { SessionModule } from '../session/session.module';
import { WeatherModule } from '../weather/weather.module';
import { JikanModule } from 'src/jikan/jikan.module';

// ----------------------------------------------------------------------

@Module({
  imports: [
    GeminiModule,
    GeocodingModule,
    JikanModule,
    SessionModule,
    WeatherModule,
  ],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
