import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [HttpModule], // GeocodingService needs HttpService
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {} 