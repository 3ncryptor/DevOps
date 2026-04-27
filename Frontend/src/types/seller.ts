import type {
  SellerStatus,
  StoreStatus,
  VerificationStatus,
  DocumentType,
  BusinessType,
} from "./common";

export interface SellerBusiness {
  legalName: string;
  displayName: string;
  businessType: BusinessType;
  taxIdentifier?: string;
}

export interface SellerContact {
  email: string;
  phone?: string;
}

export interface Seller {
  _id: string;
  userId: string;
  business: SellerBusiness;
  contact: SellerContact;
  status: SellerStatus;
  approvedAt?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerDocument {
  documentType: DocumentType;
  fileUrl: string;
  status?: VerificationStatus;
  notes?: string;
}

export interface SellerVerification {
  _id: string;
  sellerId: string;
  verificationStatus: VerificationStatus;
  documents: SellerDocument[];
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface StoreIdentity {
  name: string;
  slug: string;
}

export interface StoreBranding {
  logoUrl?: string;
  bannerUrl?: string;
}

export interface StoreLocation {
  city?: string;
  state?: string;
  country?: string;
}

export interface Store {
  _id: string;
  sellerId: string;
  storeIdentity: StoreIdentity;
  description?: string;
  branding?: StoreBranding;
  location?: StoreLocation;
  storeStatus: StoreStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSellerPayload {
  business: {
    legalName: string;
    displayName: string;
    businessType: BusinessType;
    taxIdentifier?: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  location?: StoreLocation;
}

export interface UpdateStorePayload {
  name?: string;
  description?: string;
  branding?: StoreBranding;
}
