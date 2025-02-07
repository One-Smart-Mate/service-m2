import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'mysql', // O el tipo de base de datos que estés usando
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'railway',
  synchronize: false, // Evita sincronización automática
  dropSchema: false, // Asegura que no elimine el esquema
  logging: false, // O 'all' si quieres ver los logs de las operaciones
  logger: 'file', // Guarda logs en archivo
  entities: ['./dist' + '/**/*.entity{.ts,.js}'],
  migrations: ['./dist'+ '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migration_table', // Nombre de la tabla de control de migraciones
  migrationsRun: false, // Evita que corra automáticamente las migraciones
  charset: 'utf8mb4_general_ci', // Configura el charset si usas MySQL
});

export default AppDataSource;
