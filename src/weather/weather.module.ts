import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { McpGateway } from './mcp.gateway';
import { GeminiModule } from '../gemini/gemini.module';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [
    HttpModule,
    GeminiModule,
    GeocodingModule,
  ],
  controllers: [WeatherController],
  providers: [WeatherService, McpGateway],
})
export class WeatherModule {} 