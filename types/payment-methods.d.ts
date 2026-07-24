export interface PaymentMethods {
  payMetId: number;
  payMetName: string;
  payMetDesc: string;
  payMetHasRef: number;
  payMetIsEmail: boolean;
  payMetIsOnline: boolean;
  payMetIsCustomer: boolean;
  storeId: number;
  payMetCreatedBy: number;
  payMetCreatedAt: string;
  payMetUpdatedAt: string;
  payMetDeletedAt: string;
}
