import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';

async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  const reflector = app.get(Reflector)

  // API responses are dynamic and must never be cached by the browser or a CDN.
  // Express adds a weak ETag by default, which let browsers serve a stale card
  // list (a freshly created card did not appear until the cache expired, even
  // on a hard reload). Disable ETag and mark every response no-store.
  app.disable('etag');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('OSM example')
    .setDescription('OSM API description')
    .setVersion('1.0')
    .addTag('OSM')
    .addBearerAuth()
    .build();
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector),new TransformInterceptor());
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
main();
