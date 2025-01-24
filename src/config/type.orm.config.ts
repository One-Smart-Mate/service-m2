import { TypeOrmModule } from '@nestjs/typeorm';

const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  username: 'root',
  password: 'root',
  port: parseInt('3306'),
  database: 'railway',
  host: 'localhost',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  autoLoadEntities: true,
  extra: {
    connectionLimit: 1000,
  },
  logging: true
});

export default typeOrmConfig;
