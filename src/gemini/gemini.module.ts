import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Module({
  providers: [GeminiService],
  exports: [GeminiService], // Export GeminiService so other modules can use it
})
export class GeminiModule {} 