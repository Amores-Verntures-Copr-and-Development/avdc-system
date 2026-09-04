import { UpdateInstallmentCheckDto } from "@/dtos/installment.dto";
import { BusinessError } from "@/lib/errors";
import {
  selectInstallmentChecksAllDeposited,
  selectInstallmentCheckOwnership,
  updateInstallmentCheck,
  updateInstallmentStatus,
} from "@/models/installmentModel";

export async function processUpdateInstallmentCheck({
  installmentCheckId,
  storeId,
  data,
}: {
  installmentCheckId: number;
  storeId: number;
  data: UpdateInstallmentCheckDto;
}) {
  const ownership = await selectInstallmentCheckOwnership({
    installmentCheckId,
  });

  if (!ownership || ownership.storeId !== storeId) {
    throw new BusinessError("Installment check not found for this store.");
  }

  if (
    data.installmentCheckStatus === "deposited" &&
    !data.installmentCheckDepositedDate
  ) {
    data.installmentCheckDepositedDate = new Date().toISOString().slice(0, 10);
  }

  await updateInstallmentCheck({ installmentCheckId, data });

  if (data.installmentCheckStatus === "deposited") {
    const allDeposited = await selectInstallmentChecksAllDeposited({
      installmentId: ownership.installmentId,
    });

    if (allDeposited) {
      await updateInstallmentStatus({
        installmentId: ownership.installmentId,
        installmentStatus: "completed",
      });
    }
  }

  return ownership.installmentId;
}
