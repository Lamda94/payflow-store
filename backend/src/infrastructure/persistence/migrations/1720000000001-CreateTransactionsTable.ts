import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionsTable1720000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR')
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id"                 UUID                      NOT NULL,
        "reference"          VARCHAR(100)              NOT NULL,
        "product_id"         UUID                      NOT NULL,
        "quantity"           INTEGER                   NOT NULL CHECK ("quantity" > 0),
        "amount_in_cents"    INTEGER                   NOT NULL CHECK ("amount_in_cents" > 0),
        "currency"           VARCHAR(10)               NOT NULL DEFAULT 'COP',
        "customer_email"     VARCHAR(255)              NOT NULL,
        "status"             "transaction_status_enum" NOT NULL DEFAULT 'PENDING',
        "psp_transaction_id" VARCHAR(100)              NULL,
        "created_at"         TIMESTAMPTZ               NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMPTZ               NOT NULL DEFAULT now(),
        CONSTRAINT "pk_transactions"        PRIMARY KEY ("id"),
        CONSTRAINT "uq_transactions_ref"    UNIQUE ("reference"),
        CONSTRAINT "fk_transactions_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_transactions_status" ON "transactions" ("status")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
  }
}
