export type Variant = 'expense' | 'income' | 'refund' | 'undefined';

export interface BaseModel {
  id: string;
  $id?: string;
  created?: string;
  updated?: string;
  collectionId?: string;
  collectionName?: string;
  [key: string]: any;
}

export type Types = BaseModel & {
  code: Variant;
  description: string;
  color?: string;
}

export type Categories = BaseModel & {
  code: string;
  type: Types;
  description: string;
  icon: string;
}

export type SubCategories = BaseModel & {
  code: string;
  description: string;
  icon: string;
  category: Categories;
  budget: number | null;
}

export type Transactions = BaseModel & {
  date: string;
  refundsIds?: string | null;
  value: number;
  netValue?: number | null;
  description?: string | null;
  niceDescription: string;
  notes?: string | null;
  subCategory: SubCategories;
  enableBankingId?: string | null;
  user?: string;
}

export type BankSessions = BaseModel & {
  sessionId: string;
  bankName?: string | null;
  country?: string | null;
  accounts?: string[] | null;
  validUntil?: string | null;
  status?: string | null;
  user?: string;
}

export type EnableBankingTransactions = BaseModel & {
  enableBankingId: string;
  status?: 'imported' | 'discarded' | string | null;
  user?: string;
}
