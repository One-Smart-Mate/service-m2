import { createHmac } from 'crypto';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class HardenAuthenticationSessionsAndFastPasswords1789689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const pepper = process.env.FAST_PASSWORD_PEPPER?.trim();
    if (!pepper || Buffer.byteLength(pepper, 'utf8') < 32) {
      throw new Error(
        'FAST_PASSWORD_PEPPER with at least 32 bytes is required for migration',
      );
    }

    await queryRunner.createTable(
      new Table({
        name: 'auth_sessions',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'user_id', type: 'int', unsigned: true },
          { name: 'actor_id', type: 'int', unsigned: true, isNullable: true },
          {
            name: 'parent_session_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'session_type', type: 'varchar', length: '16' },
          { name: 'platform', type: 'varchar', length: '16' },
          { name: 'expires_at', type: 'datetime', isNullable: true },
          { name: 'revoked_at', type: 'datetime', isNullable: true },
          { name: 'created_at', type: 'datetime' },
        ],
        indices: [
          {
            name: 'idx_auth_sessions_user_active',
            columnNames: ['user_id', 'revoked_at'],
          },
          {
            name: 'idx_auth_sessions_actor_active',
            columnNames: ['actor_id', 'revoked_at'],
          },
          {
            name: 'idx_auth_sessions_parent',
            columnNames: ['parent_session_id'],
          },
        ],
      }),
      true,
    );

    if (!(await queryRunner.hasColumn('users', 'fast_password_digest'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'fast_password_digest',
          type: 'char',
          length: '64',
          isNullable: true,
        }),
      );
    }

    if (await queryRunner.hasColumn('users', 'fast_password')) {
      const users: { id: number; fastPassword: string | null }[] =
        await queryRunner.query(
          'SELECT id, fast_password AS fastPassword FROM users WHERE fast_password IS NOT NULL',
        );

      for (const user of users) {
        const digest = createHmac('sha256', pepper)
          .update(user.fastPassword.trim().toUpperCase(), 'utf8')
          .digest('hex');
        await queryRunner.query(
          'UPDATE users SET fast_password_digest = ? WHERE id = ?',
          [digest, user.id],
        );
      }

      await queryRunner.query('UPDATE users SET fast_password = NULL');
      await queryRunner.dropColumn('users', 'fast_password');
    }

    const usersTable = await queryRunner.getTable('users');
    if (
      !usersTable?.indices.some(
        (index) => index.name === 'idx_users_fast_password_digest',
      )
    ) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'idx_users_fast_password_digest',
          columnNames: ['fast_password_digest'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (
      usersTable?.indices.some(
        (index) => index.name === 'idx_users_fast_password_digest',
      )
    ) {
      await queryRunner.dropIndex('users', 'idx_users_fast_password_digest');
    }
    if (!(await queryRunner.hasColumn('users', 'fast_password'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'fast_password',
          type: 'varchar',
          length: '4',
          isNullable: true,
          comment:
            'Legacy fast password column; values cannot be restored from digest',
        }),
      );
    }
    if (await queryRunner.hasColumn('users', 'fast_password_digest')) {
      await queryRunner.dropColumn('users', 'fast_password_digest');
    }
    if (await queryRunner.hasTable('auth_sessions')) {
      await queryRunner.dropTable('auth_sessions');
    }
  }
}
