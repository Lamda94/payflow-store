import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProducts1720000000003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "products" ("id", "name", "description", "image_url", "price_in_cents", "currency", "stock") VALUES
      (
        'a1b2c3d4-0001-0001-0001-000000000001',
        'Wireless Headphones Pro',
        'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
        34900000,
        'COP',
        15
      ),
      (
        'a1b2c3d4-0002-0002-0002-000000000002',
        'Mechanical Keyboard TKL',
        'Tenkeyless mechanical keyboard with tactile switches and RGB backlight.',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
        28900000,
        'COP',
        8
      ),
      (
        'a1b2c3d4-0003-0003-0003-000000000003',
        'USB-C Hub 7-in-1',
        'Multiport adapter with HDMI 4K, USB 3.0 x3, SD card reader, PD 100W.',
        'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&q=80',
        12900000,
        'COP',
        25
      ),
      (
        'a1b2c3d4-0004-0004-0004-000000000004',
        'Portable SSD 1TB',
        'Ultra-fast portable SSD with USB-C, read speeds up to 1050 MB/s.',
        'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80',
        39900000,
        'COP',
        12
      ),
      (
        'a1b2c3d4-0005-0005-0005-000000000005',
        'Webcam 4K Streaming',
        'Professional 4K webcam with autofocus, built-in microphone and privacy shutter.',
        'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400&q=80',
        24900000,
        'COP',
        10
      ),
      (
        'a1b2c3d4-0006-0006-0006-000000000006',
        'Smart LED Desk Lamp',
        'Adjustable color temperature and brightness, USB-A charging port, touch control.',
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
        8900000,
        'COP',
        20
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "products" WHERE id LIKE 'a1b2c3d4-%'`);
  }
}
