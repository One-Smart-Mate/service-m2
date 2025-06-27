import { DataSource } from 'typeorm';

export const iaDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST_IA,
  port: parseInt(process.env.DB_PORT_IA),
  username: process.env.DB_USERNAME_IA,
  password: process.env.DB_PASSWORD_IA,
  database: process.env.DB_NAME_IA,
  entities: [],
  synchronize: false,
  logging: true,
  ssl: {
    rejectUnauthorized: false
  }
}); 