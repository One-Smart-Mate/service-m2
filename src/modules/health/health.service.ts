import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { verifyDatabaseSchema } from '../../common/database/database-readiness';

@Injectable()
export class HealthService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}
  async onModuleInit() {
    await verifyDatabaseSchema(this.dataSource);
  }
  async check() {
    try {
      const [row] = await this.dataSource.query(
        'SELECT @@session.time_zone AS timezone',
      );
      if (row?.timezone !== '+00:00') throw new Error('UTC required');
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Service is not ready');
    }
  }
}
