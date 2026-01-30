import Button from "@/components/shared/Button";
import { Sales } from "@/types/sales";
import { formatPeso } from "@/utils/formatPeso";
import { CheckCircle2, Printer, Receipt } from "lucide-react";
import React from "react";
interface PaymentSuccessModalProps {
  totalPaid: number;
  change: number;
  salesData: Sales | null;
  onNewSale: () => void;
  onPrintReceipt: () => void;
}
const PaymentSuccessModal = ({
  totalPaid,
  change,
  onNewSale,
  salesData,
}: PaymentSuccessModalProps) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-10 h-10 2xl:w-20 2xl:h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-1 2xl:mb-6">
        <CheckCircle2 className=" w-6 h-6 2xl:w-12 2xl:h-12 text-emerald-500" />
      </div>

      <h2 className="text-sm 2xl:text-2xl font-bold text-slate-800 mb-2">
        Payment Successful!
      </h2>
      <p className="text-xs 2xl:text-xl  text-slate-500 mb-6">
        Transaction completed successfully
      </p>

      <div className="bg-slate-50 rounded-2xl p-3 2xl:p-6 w-full mb-1 2xl:mb-6">
        <div className="flex justify-between items-center 2xl:mb-4">
          <span className="text-sm 2xl:text-base text-slate-500">
            Total Paid
          </span>
          <span className="text-lg 2xl:text-2xl font-bold text-slate-800">
            {formatPeso(totalPaid)}
          </span>
        </div>
        <div className="flex justify-between items-center 2xl:mb-4">
          <span className="text-sm 2xl:text-base text-slate-500">
            Total Amount
          </span>
          <span className="text-lg 2xl:text-2xl font-bold text-slate-800">
            {formatPeso(salesData?.salesTotalAmount)}
          </span>
        </div>

        {change > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <span className="text-slate-500">Change Due</span>
            <span className="text-xl font-bold text-amber-600">
              {formatPeso(change)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full">
        <Button
          size="md"
          color="secondary"
          onClick={() => {
            onNewSale();
          }}
          label="New Sale"
          icon={Receipt}
        />
        <Button
          onClick={() => {}}
          label="   Print Receipt"
          icon={Printer}
          size="md"
        />
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
