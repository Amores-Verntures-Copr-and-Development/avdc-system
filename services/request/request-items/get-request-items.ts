import { selectRequestItems } from "@/models/requestModel";

export async function getRequestOrderItems({
  requestId,
}: {
  requestId?: number;
}) {
  try {
    const data = await selectRequestItems({ requestId });
    return data;
  } catch (e) {
    throw e;
  }
}
