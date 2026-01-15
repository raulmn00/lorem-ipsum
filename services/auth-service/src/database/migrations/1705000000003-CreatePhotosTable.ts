import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePhotosTable1705000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'photos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'album_id',
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
            name: 'file_key',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'thumbnail_key',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'size_bytes',
            type: 'bigint',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'dominant_color',
            type: 'varchar',
            length: '7',
          },
          {
            name: 'acquired_at',
            type: 'timestamp',
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
      'photos',
      new TableIndex({
        name: 'IDX_photos_album_id',
        columnNames: ['album_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'photos',
      new TableForeignKey({
        name: 'FK_photos_album',
        columnNames: ['album_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'albums',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('photos', 'FK_photos_album');
    await queryRunner.dropIndex('photos', 'IDX_photos_album_id');
    await queryRunner.dropTable('photos');
  }
}
