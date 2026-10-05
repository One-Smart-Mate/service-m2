import { Logger } from '@nestjs/common';
import * as mysql2 from 'mysql2';

const logger = new Logger('DatabaseUtc');

/** Queue session initialization before mysql2 hands each new connection to TypeORM. */
export const utcMysqlDriver = {
  ...mysql2,
  createPool(options: mysql2.PoolOptions) {
    const pool = mysql2.createPool({ ...options, timezone: 'Z' });
    pool.on('connection', (connection) => {
      connection.query("SET SESSION time_zone = '+00:00'", (error) => {
        if (error) {
          logger.error('Could not initialize a database connection in UTC');
          connection.destroy();
        }
      });
    });
    return pool;
  },
};
