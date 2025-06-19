import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: 'iaConnection',
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST_IA,
        port: parseInt(process.env.DB_PORT_IA),
        username: process.env.DB_USERNAME_IA,
        password: process.env.DB_PASSWORD_IA?.replace(/^"(.*)"$/, '$1'),
        database: process.env.DB_NAME_IA,
        entities: [],
        synchronize: false,
        autoLoadEntities: true,
        extra: {
          connectionLimit: 1000,
        },
        logging: true,
        ssl: {
          rejectUnauthorized: false
        }
      }),
    }),
  ],
  controllers: [IaController],
  providers: [IaService, CustomLoggerService],
  exports: [IaService],
})
export class IaModule {} 