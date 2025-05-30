import { Module } from '@nestjs/common';
import { JikanQuery } from './jikan.query';
import { JikanService } from './jikan.service';

// ----------------------------------------------------------------------

@Module({
  providers: [JikanService, JikanQuery],
  exports: [JikanService],
})
export class JikanModule {}
