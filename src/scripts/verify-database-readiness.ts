import 'dotenv/config';
import AppDataSource from '../config/data-source';
import { verifyDatabaseSchema } from '../common/database/database-readiness';
export {
  supportsSkipLocked,
  verifyDatabaseSchema,
} from '../common/database/database-readiness';

async function verifyDatabaseReadiness(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await verifyDatabaseSchema(AppDataSource);
    process.stdout.write(
      'Database readiness verified: UTC, migrations, InnoDB, indexes and sync triggers.\n',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  verifyDatabaseReadiness().catch(() => {
    process.stderr.write(
      'Database readiness verification failed. Check database configuration and required migrations.\n',
    );
    process.exitCode = 1;
  });
}
