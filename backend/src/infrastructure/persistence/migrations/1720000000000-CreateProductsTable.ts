import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1720000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"             UUID         NOT NULL,
        "name"           VARCHAR(255) NOT NULL,
        "description"    TEXT         NOT NULL,
        "image_url"      VARCHAR(500) NOT NULL,
        "price_in_cents" INTEGER      NOT NULL CHECK ("price_in_cents" >= 0),
        "currency"       VARCHAR(10)  NOT NULL DEFAULT 'COP',
        "stock"          INTEGER      NOT NULL DEFAULT 0 CHECK ("stock" >= 0),
        CONSTRAINT "pk_products" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
