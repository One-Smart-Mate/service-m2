import { TypeOrmModule } from '@nestjs/typeorm';

const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  username: 'root',
  password: '123',
  port: parseInt('37428'),
  database: 'railway',
  host: 'monorail.proxy.rlwy.net',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  autoLoadEntities: true,
  extra: {
    connectionLimit: 1000,
  },
  logging: true
});

export default typeOrmConfig;
