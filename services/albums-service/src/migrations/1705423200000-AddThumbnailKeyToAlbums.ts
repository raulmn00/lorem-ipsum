import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThumbnailKeyToAlbums1705423200000 implements MigrationInterface {
  name = 'AddThumbnailKeyToAlbums1705423200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "albums" ADD COLUMN IF NOT EXISTS "thumbnail_key" VARCHAR(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "albums" DROP COLUMN IF EXISTS "thumbnail_key"`,
    );
  }
}
