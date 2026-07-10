import { Product } from './product.entity';
import { InsufficientStockError } from '../errors/domain.errors';

const makeProduct = (stock: number) =>
  new Product('p-1', 'Test Product', 'Description', 'http://img.url', 199000, 'COP', stock);

describe('Product', () => {
  describe('hasStock()', () => {
    it('returns true when stock is sufficient', () => {
      expect(makeProduct(5).hasStock(3)).toBe(true);
    });

    it('returns true when stock equals requested qty', () => {
      expect(makeProduct(3).hasStock(3)).toBe(true);
    });

    it('returns false when stock is insufficient', () => {
      expect(makeProduct(2).hasStock(3)).toBe(false);
    });

    it('returns false when stock is zero', () => {
      expect(makeProduct(0).hasStock(1)).toBe(false);
    });
  });

  describe('decreaseStock()', () => {
    it('decreases stock by the given quantity', () => {
      const product = makeProduct(10);
      product.decreaseStock(3);
      expect(product.stock).toBe(7);
    });

    it('decreases stock to zero when qty equals stock', () => {
      const product = makeProduct(5);
      product.decreaseStock(5);
      expect(product.stock).toBe(0);
    });

    it('throws InsufficientStockError when stock is insufficient', () => {
      const product = makeProduct(2);
      expect(() => product.decreaseStock(3)).toThrow(InsufficientStockError);
    });

    it('throws with correct message', () => {
      const product = makeProduct(2);
      expect(() => product.decreaseStock(5)).toThrow('available 2');
    });

    it('throws when stock is zero', () => {
      const product = makeProduct(0);
      expect(() => product.decreaseStock(1)).toThrow(InsufficientStockError);
    });

    it('does not modify stock when throwing', () => {
      const product = makeProduct(2);
      try { product.decreaseStock(5); } catch { /* expected */ }
      expect(product.stock).toBe(2);
    });
  });
});
