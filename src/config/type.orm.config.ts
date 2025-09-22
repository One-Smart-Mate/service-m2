import { TypeOrmModule } from '@nestjs/typeorm';

const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  username: 'root',
  password: 'nJpPjMXrgTVYAfgYmwoiusECdFSPSCEm',
  port: parseInt('25045'),
  database: 'railway',
  host: 'autorack.proxy.rlwy.net',
  entities: [__dirname + '//*.entity{.ts,.js}'],
  synchronize: false,
  autoLoadEntities: true,
   extra: {
    connectionLimit: 10,      
    acquireTimeout: 5000,     
    timeout: 30000,          
    reconnect: true,
    idleTimeout: 300000,     
    maxIdle: 3,             
  },
  logging: true
});

export default typeOrmConfig;