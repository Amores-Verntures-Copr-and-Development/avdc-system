import { CustomerCart } from "@/types/customerCart";

export type CreateCustomerCartDto = Pick<
  CustomerCart,
  "customerId" | "prodVarId" | "cartQuantity"
>;

export type UpdateCustomerCartDto = Pick<CustomerCart, "cartQuantity">;

export interface DisplayCustomerCartDto extends CustomerCart {
  prodVarName: string;
  prodVarPrice: number;
  prodVarUnit: string | null;
  prodVarImage: string | null;
  prodName: string;
}
