import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The seeded product ids ('a1b2c3d4-000X-000X-000X-...') are not
 * RFC 4122 UUIDs (version nibble '0'), so @IsUUID() rejected every
 * POST /transactions. This rewrites the version nibble to '4' and the
 * variant nibble to '8' (positions 15 and 20 of the textual form),
 * cascading the same transform to the referencing rows.
 */
export class FixSeedProductIds1720000000004 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await this.rewriteIds(queryRunner, '4', '8');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.rewriteIds(queryRunner, '0', '0');
  }

  private async rewriteIds(
    queryRunner: QueryRunner,
    versionNibble: string,
    variantNibble: string,
  ): Promise<void> {
    const rewrite = (column: string) =>
      `overlay(overlay(${column}::text placing '${versionNibble}' from 15 for 1) placing '${variantNibble}' from 20 for 1)::uuid`;
    const seeded = (column: string) => `${column}::text LIKE 'a1b2c3d4-%'`;

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "fk_transactions_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" DROP CONSTRAINT "fk_deliveries_product"`,
    );

    await queryRunner.query(
      `UPDATE "products" SET "id" = ${rewrite('"id"')} WHERE ${seeded('"id"')}`,
    );
    await queryRunner.query(
      `UPDATE "transactions" SET "product_id" = ${rewrite('"product_id"')} WHERE ${seeded('"product_id"')}`,
    );
    await queryRunner.query(
      `UPDATE "deliveries" SET "product_id" = ${rewrite('"product_id"')} WHERE ${seeded('"product_id"')}`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "fk_transactions_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" ADD CONSTRAINT "fk_deliveries_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")`,
    );
  }
}
