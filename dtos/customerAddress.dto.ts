import { CustomerAddress } from "@/types/customer";

export type CreateCustomerAddressDto = Pick<
  CustomerAddress,
  "customerId" | "label" | "phone" | "street" | "barangay" | "city" | "province"
> &
  Partial<Pick<CustomerAddress, "isDefault">>;

export type UpdateCustomerAddressDto = Partial<
  Pick<
    CustomerAddress,
    | "label"
    | "phone"
    | "isDefault"
    | "street"
    | "barangay"
    | "city"
    | "province"
  >
>;
