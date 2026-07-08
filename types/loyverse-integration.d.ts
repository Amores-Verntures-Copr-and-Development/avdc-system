// loyverseIntegration.interface.ts

export interface LoyverseIntegrationInterface {
  id: number;
  integId: number;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  merchantId: string | null;
  scope: string;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  connectedAt: string;
  updatedAt: string;
  createdBy: strin;
}

export interface MerchantInteface {
  id: string;
  business_name: string;
  email: string;
  country: string;
  currency: MerchantCurrency;
  created_at: string;
}

export interface MerchantCurrency {
  code: string;
  decimal_phase: number;
}
