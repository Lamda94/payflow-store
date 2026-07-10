import { InvalidTransactionStateError, TransactionAlreadyProcessedError } from '../errors/domain.errors';

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
}

export interface TransactionProps {
  id: string;
  reference: string;
  productId: string;
  quantity: number;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  status: TransactionStatus;
  pspTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  readonly id: string;
  readonly reference: string;
  readonly productId: string;
  readonly quantity: number;
  readonly amountInCents: number;
  readonly currency: string;
  readonly customerEmail: string;
  private _status: TransactionStatus;
  private _pspTransactionId?: string;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TransactionProps) {
    this.id = props.id;
    this.reference = props.reference;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.amountInCents = props.amountInCents;
    this.currency = props.currency;
    this.customerEmail = props.customerEmail;
    this._status = props.status;
    this._pspTransactionId = props.pspTransactionId;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get pspTransactionId(): string | undefined {
    return this._pspTransactionId;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  isPending(): boolean {
    return this._status === TransactionStatus.PENDING;
  }

  isFinished(): boolean {
    return (
      this._status === TransactionStatus.APPROVED ||
      this._status === TransactionStatus.DECLINED ||
      this._status === TransactionStatus.ERROR
    );
  }

  approve(pspTransactionId: string, now: Date): void {
    this.assertPending();
    this._status = TransactionStatus.APPROVED;
    this._pspTransactionId = pspTransactionId;
    this._updatedAt = now;
  }

  decline(pspTransactionId: string, now: Date): void {
    this.assertPending();
    this._status = TransactionStatus.DECLINED;
    this._pspTransactionId = pspTransactionId;
    this._updatedAt = now;
  }

  markAsError(now: Date, pspTransactionId?: string): void {
    this.assertPending();
    this._status = TransactionStatus.ERROR;
    this._pspTransactionId = pspTransactionId;
    this._updatedAt = now;
  }

  private assertPending(): void {
    if (this.isFinished()) {
      throw new TransactionAlreadyProcessedError(this.id);
    }
    if (!this.isPending()) {
      throw new InvalidTransactionStateError(this._status, 'terminal');
    }
  }

  static createPending(props: Omit<TransactionProps, 'status'>): Transaction {
    return new Transaction({ ...props, status: TransactionStatus.PENDING });
  }
}
