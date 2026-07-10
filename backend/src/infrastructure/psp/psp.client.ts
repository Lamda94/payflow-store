import axios, { AxiosInstance } from 'axios';

export interface PspMerchantResponse {
  data: {
    presigned_acceptance: {
      acceptance_token: string;
    };
  };
}

export interface PspCardTokenResponse {
  status: string;
  data: {
    id: string;
  };
}

export interface PspTransactionResponse {
  data: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
    status_message: string | null;
  };
}

export interface PspCreateTransactionBody {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
  acceptance_token: string;
  signature: string;
  payment_method: {
    type: 'CARD';
    token: string;
    installments: number;
  };
}

export class PspClient {
  private readonly http: AxiosInstance;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(baseUrl: string, publicKey: string, privateKey: string, timeoutMs = 10000) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.http = axios.create({ baseURL: baseUrl, timeout: timeoutMs });
  }

  async getMerchantAcceptanceToken(): Promise<string> {
    const res = await this.http.get<PspMerchantResponse>(`/merchants/${this.publicKey}`);
    return res.data.data.presigned_acceptance.acceptance_token;
  }

  async tokenizeCard(card: {
    number: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
  }): Promise<string> {
    const res = await this.http.post<PspCardTokenResponse>(
      '/tokens/cards',
      {
        number: card.number,
        cvc: card.cvc,
        exp_month: card.expMonth,
        exp_year: card.expYear,
        card_holder: card.cardHolder,
      },
      { headers: { Authorization: `Bearer ${this.publicKey}` } },
    );
    return res.data.data.id;
  }

  async createTransaction(body: PspCreateTransactionBody): Promise<string> {
    const res = await this.http.post<PspTransactionResponse>('/transactions', body, {
      headers: { Authorization: `Bearer ${this.privateKey}` },
    });
    return res.data.data.id;
  }

  async getTransactionStatus(pspTransactionId: string): Promise<PspTransactionResponse['data']> {
    const res = await this.http.get<PspTransactionResponse>(`/transactions/${pspTransactionId}`, {
      headers: { Authorization: `Bearer ${this.privateKey}` },
    });
    return res.data.data;
  }
}
