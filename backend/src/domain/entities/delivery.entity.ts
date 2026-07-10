export interface DeliveryProps {
  id: string;
  transactionId: string;
  productId: string;
  customerEmail: string;
  quantity: number;
  createdAt: Date;
}

export class Delivery {
  readonly id: string;
  readonly transactionId: string;
  readonly productId: string;
  readonly customerEmail: string;
  readonly quantity: number;
  readonly createdAt: Date;

  constructor(props: DeliveryProps) {
    this.id = props.id;
    this.transactionId = props.transactionId;
    this.productId = props.productId;
    this.customerEmail = props.customerEmail;
    this.quantity = props.quantity;
    this.createdAt = props.createdAt;
  }

  static create(props: DeliveryProps): Delivery {
    return new Delivery(props);
  }
}
