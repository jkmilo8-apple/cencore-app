'use server';

import { QuoteRepository } from '@/repositories/quote-repository';
import { CreateQuoteDTO } from '@/types/domain';
import { revalidatePath } from 'next/cache';

const quoteRepo = new QuoteRepository();

export async function createQuoteAction(data: CreateQuoteDTO) {
  try {
    const newQuote = await quoteRepo.createQuote(data);
    revalidatePath('/quotes');
    return { success: true, data: newQuote };
  } catch (error: any) {
    console.error('Failed to create quote:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchQuotesAction() {
  try {
    const quotes = await quoteRepo.getQuotes();
    return { success: true, data: quotes };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
