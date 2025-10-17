import { StoreInterface } from "@/types/stores";

export type CreateStoreDto = Pick<
  StoreInterface,
  "storeName" | "storeLocation" | "storeDescription" | "storeCreatedBy"
>;
