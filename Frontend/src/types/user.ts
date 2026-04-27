import type { AddressType, AddressLabel, Gender } from "./common";

export interface UserPersonal {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  profileImageUrl?: string;
}

export interface UserContact {
  primaryPhone?: string;
  secondaryPhone?: string;
}

export interface UserPreferences {
  language?: string;
  currency?: string;
  marketingOptIn?: boolean;
}

export interface UserProfile {
  _id: string;
  userId: string;
  personal: UserPersonal;
  contact: UserContact;
  preferences: UserPreferences;
}

export interface AddressRecipient {
  fullName: string;
  phoneNumber?: string;
}

export interface Address {
  _id: string;
  userId: string;
  label: AddressLabel;
  type: AddressType;
  recipient: AddressRecipient;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  avatarUrl?: string;
  phone?: string;
}

export interface CreateAddressPayload {
  label: AddressLabel;
  type: AddressType;
  recipient: AddressRecipient;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}
