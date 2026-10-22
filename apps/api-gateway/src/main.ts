import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter, setupSwagger } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = Number(process.env.PORT ?? 3000);
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'docs', 'docs-json', 'docs-yaml'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app, 'Smart Recipe API Gateway', { port });

  await app.listen(port);
  Logger.log(`api-gateway http://localhost:${port}/api/v1 | swagger /docs`, 'Bootstrap');
}
void bootstrap();
