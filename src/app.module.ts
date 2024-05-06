import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';



@Module({
  imports: [
    ConfigModule.forRoot(),
    typeOrmConfig,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
