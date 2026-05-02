export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  city: string | null;
  contact_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  category: string | null;
  stock: number;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  valid_until: string | null;
  quote_number: string | null;
  notes: string | null;
  urgent_delivery: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  clients?: Client;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  // Joined
  products?: Product;
}
