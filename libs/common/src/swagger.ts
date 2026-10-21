import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  title: string,
  options?: { path?: string; port?: number },
): void {
  const path = options?.path ?? 'docs';
  const port = options?.port ?? Number(process.env.PORT ?? 3000);
  const publicUrl =
    process.env.SWAGGER_PUBLIC_URL ?? `http://localhost:${port}`;

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription('Smart Recipe API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(publicUrl, 'localhost (Docker Desktop)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const instance = app.getHttpAdapter().getInstance() as {
    get?: (path: string, handler: (...args: unknown[]) => void) => void;
  };
  instance.get?.('/', (_req: unknown, res: { redirect: (code: number, url: string) => void }) => {
    res.redirect(302, `/${path}`);
  });
}
