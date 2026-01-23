import axios from 'axios';

export class MercadoPagoClient {
  constructor(private readonly accessToken: string) {}

  async getPayment(paymentId: string) {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    return response.data;
  }

  async getSubscription(subscriptionId: string) {
    const response = await axios.get(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    return response.data;
  }
}
