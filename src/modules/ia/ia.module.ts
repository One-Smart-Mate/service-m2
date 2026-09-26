import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDatabaseTlsOptions } from 'src/config/transport-security.config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: 'iaConnection',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST_IA'),
        port: Number(configService.get<string>('DB_PORT_IA')),
        username: configService.get<string>('DB_USERNAME_IA'),
        password: configService
          .get<string>('DB_PASSWORD_IA')
          ?.replace(/^"(.*)"$/, '$1'),
        database: configService.get<string>('DB_NAME_IA'),
        entities: [],
        synchronize: false,
        autoLoadEntities: true,
        extra: {
          connectionLimit: 10,
          multipleStatements: false,
        },
        logging: false,
        ssl: createDatabaseTlsOptions('DB_IA', {
          ...process.env,
          DB_IA_SSL_ENABLED: configService.get<string>('DB_IA_SSL_ENABLED'),
          DB_IA_SSL_CA: configService.get<string>('DB_IA_SSL_CA'),
        }),
      }),
    }),
  ],
  controllers: [IaController],
  providers: [IaService, CustomLoggerService],
  exports: [IaService],
})
export class IaModule {}
