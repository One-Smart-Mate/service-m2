import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';

async function main() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const reflector = app.get(Reflector)

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
