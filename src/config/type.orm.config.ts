import { TypeOrmModule } from '@nestjs/typeorm';

const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  username: 'root',
  password: 'nJpPjMXrgTVYAfgYmwoiusECdFSPSCEm',
  port: 25045,
  database: 'railway',
  host: 'autorack.proxy.rlwy.net',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  autoLoadEntities: true,
  extra: {
    connectionLimit: 1000,
  },
  logging: true
});

export default typeOrmConfig;
