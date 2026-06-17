// loyverseIntegration.interface.ts

export interface LoyverseIntegrationInterface {
  id: number;
  integId: number;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  connectedAt: string;
  updatedAt: string;
  createdBy: strin;
}
