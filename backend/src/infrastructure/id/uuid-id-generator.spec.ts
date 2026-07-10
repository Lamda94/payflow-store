import { UuidIdGenerator } from './uuid-id-generator';

describe('UuidIdGenerator', () => {
  const generator = new UuidIdGenerator();

  it('generates a valid UUID v4', () => {
    const id = generator.generate();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique ids on successive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generator.generate()));
    expect(ids.size).toBe(20);
  });
});
