import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePasswordResetsTable1705000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_resets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'password_resets',
      new TableIndex({
        name: 'IDX_password_resets_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'password_resets',
      new TableForeignKey({
        name: 'FK_password_resets_user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('password_resets', 'FK_password_resets_user');
    await queryRunner.dropIndex('password_resets', 'IDX_password_resets_token');
    await queryRunner.dropTable('password_resets');
  }
}
