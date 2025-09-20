import { TypeOrmModule } from '@nestjs/typeorm';

const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
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