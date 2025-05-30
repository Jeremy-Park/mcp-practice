import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

// ----------------------------------------------------------------------

@Module({
  imports: [HttpModule, GeminiModule, GeocodingModule],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
