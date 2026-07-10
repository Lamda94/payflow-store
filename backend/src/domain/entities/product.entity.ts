import { InsufficientStockError } from '../errors/domain.errors';

export class Product {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string,
    readonly imageUrl: string,
    readonly priceInCents: number,
    readonly currency: string,
    private _stock: number,
  ) {}

  get stock(): number {
    return this._stock;
  }

  hasStock(qty: number): boolean {
    return this._stock >= qty;
  }

  decreaseStock(qty: number): void {
    if (!this.hasStock(qty)) {
      throw new InsufficientStockError(this._stock, qty);
    }
    this._stock -= qty;
  }
}
