import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { GeminiModule } from '../gemini/gemini.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { SessionModule } from '../session/session.module';
import { WeatherModule } from '../weather/weather.module';

// ----------------------------------------------------------------------

@Module({
  imports: [
    GeminiModule,
    GeocodingModule,
    SessionModule,
    WeatherModule,
  ],
  providers: [WebsocketGateway],
})
export class WebsocketModule {} 