import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliveriesTable1720000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "deliveries" (
        "id"             UUID         NOT NULL,
        "transaction_id" UUID         NOT NULL,
        "product_id"     UUID         NOT NULL,
        "customer_email" VARCHAR(255) NOT NULL,
        "quantity"       INTEGER      NOT NULL CHECK ("quantity" > 0),
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_deliveries"             PRIMARY KEY ("id"),
        CONSTRAINT "uq_deliveries_transaction" UNIQUE ("transaction_id"),
        CONSTRAINT "fk_deliveries_transaction" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id"),
        CONSTRAINT "fk_deliveries_product"     FOREIGN KEY ("product_id")     REFERENCES "products"("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "deliveries"`);
  }
}
