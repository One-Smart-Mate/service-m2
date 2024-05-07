import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function main() {
  const app = await NestFactory.create(AppModule,{ cors: true });

  const config = new DocumentBuilder()
    .setTitle('M2 example')
    .setDescription('M2 API description')
    .setVersion('1.0')
    .addTag('M2')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  

  await app.listen(process.env.PORT || 3000);
}
main();

