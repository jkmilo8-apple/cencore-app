import axios from 'axios';

// Clean Architecture: Service pattern for external integrations
export class PricingService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:8000';
  }

  async calculateQuotePrice(quoteId: string, items: any[]): Promise<number> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/v1/calculate`, {
        quote_id: quoteId,
        items,
      });
      return response.data.total_price;
    } catch (error) {
      console.error('Failed to calculate pricing from microservice', error);
      throw new Error('Pricing calculation failed');
    }
  }
}
