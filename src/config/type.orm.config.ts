import { TypeOrmModule } from '@nestjs/typeorm';

const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'nJpPjMXrgTVYAfgYmwoiusECdFSPSCEm',
  port: parseInt(process.env.DB_PORT) || 25045,
  database: process.env.DB_NAME || 'railway',
  host: process.env.DB_HOST || 'autorack.proxy.rlwy.net',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  autoLoadEntities: true,
  extra: {
    connectionLimit: 1000,
  },
  logging: true
});

export default typeOrmConfig;
