import { createClient } from '@/lib/supabase/server';
import { Quote, CreateQuoteDTO } from '@/types/domain';

// Clean Architecture: Repository pattern abstracts away the database
export class QuoteRepository {
  async getQuotes(): Promise<Quote[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('quotes').select('*');

    if (error) throw new Error(error.message);

    return data.map((q: any) => ({
      id: q.id,
      createdAt: new Date(q.created_at),
      title: q.title,
      totalPrice: q.total_price,
      status: q.status,
    }));
  }

  async createQuote(quote: CreateQuoteDTO): Promise<Quote> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        title: quote.title,
        status: quote.status,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      createdAt: new Date(data.created_at),
      title: data.title,
      totalPrice: data.total_price,
      status: data.status,
    };
  }
}
