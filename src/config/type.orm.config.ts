import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDatabaseTlsOptions } from './transport-security.config';

const typeOrmConfig = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql' as const,
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    port: Number(configService.get<string>('DB_PORT')),
    database: configService.get<string>('DB_NAME'),
    host: configService.get<string>('DB_HOST'),
    entities: [__dirname + '//*.entity{.ts,.js}'],
    synchronize: false,
    autoLoadEntities: true,
    ssl: createDatabaseTlsOptions('DB', {
      ...process.env,
      DB_SSL_ENABLED: configService.get<string>('DB_SSL_ENABLED'),
      DB_SSL_CA: configService.get<string>('DB_SSL_CA'),
    }),
    extra: {
      connectionLimit: 10,
      acquireTimeout: 5000,
      timeout: 30000,
      reconnect: true,
      idleTimeout: 300000,
      maxIdle: 3,
    },
    logging: false,
  }),
});

export default typeOrmConfig;
