import { INestApplication, Logger, Type, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { protoPath } from '@app/contracts';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { setupSwagger } from './swagger';

export async function bootstrapHybridService(options: {
  module: Type<unknown>;
  serviceName: string;
  httpPort: number;
  grpcPort: number;
  grpcPackage: string | string[];
  protoFile: string | string[];
  swaggerTitle: string;
  enableRmq?: boolean;
  rmqQueue?: string;
}): Promise<INestApplication> {
  const app = await NestFactory.create(options.module);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: options.grpcPackage,
      protoPath: Array.isArray(options.protoFile)
        ? options.protoFile.map((file) => protoPath(file))
        : protoPath(options.protoFile),
      url: `0.0.0.0:${options.grpcPort}`,
      loader: { keepCase: true },
    },
  });

  if (options.enableRmq && options.rmqQueue) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5673'],
        queue: options.rmqQueue,
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 10,
      },
    });
  }

  setupSwagger(app, options.swaggerTitle, { port: options.httpPort });
  await app.startAllMicroservices();
  await app.listen(options.httpPort);
  Logger.log(
    `${options.serviceName} HTTP :${options.httpPort} | gRPC :${options.grpcPort} | swagger /docs`,
    'Bootstrap',
  );
  return app;
}
