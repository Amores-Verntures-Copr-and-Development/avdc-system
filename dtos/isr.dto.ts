import { InterStoreRequests } from "@/types/isr";

export type CreateISRDto = Pick<
  InterStoreRequests,
  "isrCode" | "isrName" | "isrCreatedBy"
>;
