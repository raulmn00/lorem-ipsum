import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateAlbumsTable1705000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'albums',
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
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
          },
          {
            name: 'public_token',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'albums',
      new TableIndex({
        name: 'IDX_albums_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'albums',
      new TableIndex({
        name: 'IDX_albums_public_token',
        columnNames: ['public_token'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('albums', 'IDX_albums_public_token');
    await queryRunner.dropIndex('albums', 'IDX_albums_user_id');
    await queryRunner.dropTable('albums');
  }
}
