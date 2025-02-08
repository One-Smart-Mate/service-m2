import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'mysql', 
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, 
  dropSchema: false, 
  logging: false, 
  logger: 'file', 
  entities: ['./dist' + '/**/*.entity{.ts,.js}'],
  migrations: ['./dist'+ '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migration_table', 
  migrationsRun: false, 
  charset: 'utf8mb4_general_ci', 
});

export default AppDataSource;
