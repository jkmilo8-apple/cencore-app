export interface Quote {
  id: string;
  createdAt: Date;
  title: string;
  totalPrice: number | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

export type CreateQuoteDTO = Omit<Quote, 'id' | 'createdAt' | 'totalPrice'>;
export type UpdateQuoteDTO = Partial<CreateQuoteDTO>;
