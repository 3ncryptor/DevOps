export interface CartItem {
  productId: {
    _id: string;
    identity: { title: string };
    images?: { url: string; altText?: string }[];
    pricing?: { price: number; currency: string }[];
    storeId?: string;
  };
  storeId: string;
  quantity: number;
  addedAt: string;
}

export interface CartSummary {
  totalItems: number;
  subtotal: number;
  currency: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  summary?: CartSummary;
}

export interface CartCount {
  count: number;
}

export interface CartByStore {
  stores: {
    storeId: string;
    storeName?: string;
    items: CartItem[];
    subtotal: number;
  }[];
  summary: CartSummary;
}

export interface CartValidationIssue {
  productId: string;
  reason: string;
}

export interface CartValidation {
  isValid: boolean;
  validItems: CartItem[];
  issues: CartValidationIssue[];
}
