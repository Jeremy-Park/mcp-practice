import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { WeatherService } from './weather.service';

// ----------------------------------------------------------------------

@Module({
  imports: [HttpModule, GeminiModule, GeocodingModule],
  controllers: [],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
