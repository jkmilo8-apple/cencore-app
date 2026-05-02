// This file should ideally be generated using the Supabase CLI:
// supabase gen types typescript --project-id "$PROJECT_REF" > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: {
          id: string
          created_at: string
          title: string
          total_price: number | null
          status: 'draft' | 'pending' | 'approved' | 'rejected'
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          total_price?: number | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          total_price?: number | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
        }
      }
    }
  }
}
