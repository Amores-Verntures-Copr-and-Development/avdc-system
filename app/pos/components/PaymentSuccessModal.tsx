import Button from "@/components/shared/Button";
import { Sales } from "@/types/sales";
import { formatPeso } from "@/utils/formatPeso";
import { CheckCircle, CheckCircle2, Printer, Receipt } from "lucide-react";
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
  onPrintReceipt,
}: PaymentSuccessModalProps) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Payment Successful!
      </h2>
      <p className="text-slate-500 mb-6">Transaction completed successfully</p>

      <div className="bg-slate-50 rounded-2xl p-6 w-full mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-500">Total Paid</span>
          <span className="text-2xl font-bold text-slate-800">
            {formatPeso(totalPaid)}
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
          color="secondary"
          className="flex-1 h-12"
          onClick={() => {
            onNewSale();
          }}
          label="New Sale"
          icon={<Receipt className="w-4 h-4 mr-2" />}
        />
        <Button
          className="flex-1 h-12"
          onClick={() => {}}
          label="   Print Receipt"
          icon={<Printer className="w-4 h-4 mr-2" />}
        />
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
