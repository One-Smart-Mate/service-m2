import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'railway',
  synchronize: false,
  dropSchema: false,
  logging: false,
  logger: 'file',
  entities: ['./dist' + '/**/*.entity{.ts,.js}'],
  migrations: ['./dist'+ '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migration_table',
});
export default AppDataSource;
