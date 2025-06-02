import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const port = process.env.PORT || 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS
  // If you want to enable a global prefix for all HTTP routes (e.g., /api)
  // app.setGlobalPrefix('api');

  // For WebSockets, the gateway will handle its own path and port implicitly
  // or can be configured separately if not using the same HTTP server port.

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port} (and WebSockets will be on this port too if using the default adapter)`, 'Bootstrap');
}
bootstrap();
