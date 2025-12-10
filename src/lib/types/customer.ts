/**
 * @file customer.ts
 * @description Customer 타입 정의
 * Supabase Database Schema Types
 */

/**
 * Customer 타입 (Supabase Database)
 */
export interface Customer {
  id: string;
  userId: string;
  businessNumber: string;
  businessType: string;
  corporateNumber: string | null;
  name: string;
  industry: string;
  companySize: string | null;
  location: string;
  budget: number | null;
  challenges: string[];
  goals: string[];
  preferredKeywords: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
