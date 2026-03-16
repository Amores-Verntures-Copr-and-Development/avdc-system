import React, { useEffect, useState } from "react";
import { OrderList } from "../PosPage";
import { formatPeso } from "@/utils/formatPeso";
import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import { PaymentMethods } from "@/types/payment-methods";
import IconButton from "@/components/shared/IconButton";
import {
  Banknote,
  Check,
  CreditCard,
  PhilippinePeso,
  Plus,
  Wallet,
  X,
} from "lucide-react";
import { CreateSalePaymentDto, CreateSalesDiscount } from "@/dtos/sales.dto";
import Input from "@/components/shared/Input";
import { handleChange } from "@/utils/handle-change";
import Textarea from "@/components/shared/TextArea";
import { SalesPaymentStatus } from "@/types/sales";

interface CheckOutModalProps {
  order: OrderList[] | null;
  discounts: CreateSalesDiscount[] | null;
  paymentMethods: PaymentMethods[] | null;
  selectedPaymentMethod: CreateSalePaymentDto[] | null;
  addPayment: (payment: CreateSalePaymentDto) => void;
  setSelectedPaymentMethod: React.Dispatch<
    React.SetStateAction<CreateSalePaymentDto[] | null>
  >;
  handleCompleteSale: (remarks?: string) => void;
  totalPaid: number;
  subtotal: number;
  remaining: number;
  change: number;
  canComplete: boolean;
  isConfirming: boolean;
}

const CheckOutModal = ({
  discounts,
  paymentMethods,
  selectedPaymentMethod,
  addPayment,
  setSelectedPaymentMethod,
  handleCompleteSale,
  totalPaid,
  subtotal,
  remaining,
  change,
  canComplete,
  isConfirming,
}: CheckOutModalProps) => {
  const [remarks, setRemarks] = useState<string>("");
  const handleRemarkChange = handleChange(remarks, setRemarks);
  const [selectedMethod, setSelectedMethod] =
    useState<CreateSalePaymentDto | null>({
      paymentReference: "",
      payMetId: 0,
      salesPaymentAmount: 0,
      salesId: 0,
      salesPaymentStatus: SalesPaymentStatus.COMPLETED,
    });

  useEffect(() => {
    const defaultMethod = paymentMethods?.find(
      (pm) => pm.payMetName === "Cash",
    );
    if (defaultMethod) {
      // Check if already added
      const exists = selectedPaymentMethod?.some(
        (p) => p.payMetId === defaultMethod.payMetId,
      );
      if (!exists) {
        setSelectedMethod((prev) => {
          if (!prev) {
            return {
              salesId: 0,
              payMetId: defaultMethod.payMetId,
              salesPaymentAmount: 0,
              paymentReference: "",
              salesPaymentStatus: SalesPaymentStatus.COMPLETED,
            };
          }

          return {
            ...prev,
            payMetId: defaultMethod.payMetId,
          };
        });
      }
    }
  }, []);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const removePayment = (index: number) => {
    setSelectedPaymentMethod((prev) =>
      prev ? prev.filter((_, i) => i !== index) : null,
    );
  };

  const getPaymentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "cash":
        return { color: "bg-green-500", icon: Banknote };
      case "bank":
      case "debit card":
      case "credit card":
        return { color: "bg-blue-500", icon: CreditCard };
      case "gcash":
      case "paymaya":
      case "e-wallet":
        return { color: "bg-purple-500", icon: Wallet };
      default:
        return { color: "bg-gray-500", icon: Wallet };
    }
  };
  const findPaymentMethod = paymentMethods?.find(
    (pm) => pm.payMetId === selectedMethod?.payMetId,
  );
  const handleChangeSelectedPayment = handleChange(
    selectedMethod,
    setSelectedMethod,
  );
  const handleAddPayment = () => {
    if (!selectedMethod) return;

    const paymentToAdd: CreateSalePaymentDto = {
      ...selectedMethod,
      salesPaymentAmount: Number(selectedMethod.salesPaymentAmount) || 0,
      salesId: 0,
    };
    addPayment(paymentToAdd);

    setSelectedMethod({
      paymentReference: "",
      payMetId: 0,
      salesId: 0,
      salesPaymentAmount: 0,
      salesPaymentStatus: SalesPaymentStatus.COMPLETED,
    });
  };
  const handleQuickAmount = (qa: number) => {
    setSelectedMethod((prev) => {
      if (!prev) return prev; // or return null

      return {
        ...prev,
        salesPaymentAmount: qa,
      };
    });
  };
  const getTotalAmount = (): number => {
    if (!discounts || discounts.length === 0) return subtotal;

    const totalDiscount = discounts.reduce(
      (acc, disc) => acc + disc.discountAmount,
      0,
    );

    return Math.max(subtotal - totalDiscount, 0); // prevent negative
  };
  return (
    <div className="flex flex-col h-full gap-1 2xl:gap-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50  p-1 2xl:p-4 shadow text-center">
          <p className="text-[10px] 2xl:text-xs text-slate-500 mb-1">Total</p>
          <p className="font-bold text-[9px] md:text-xs 2xl:text-sm text-slate-800">
            {formatPeso(getTotalAmount())}
          </p>
        </div>
        <div className="bg-emerald-50 shadow p-1 2xl:p-4 text-center">
          <p className="text-[10px] 2xl:text-xs text-emerald-600 mb-1">Paid</p>
          <p className="font-bold text-[9px] md:text-xs 2xl:text-sm text-emerald-600">
            {formatPeso(totalPaid || 0)}
          </p>
        </div>
        <div
          className={`shadow p-1 2xl:p-4 text-center ${
            remaining > 0 ? "bg-amber-50" : "bg-emerald-50"
          }`}
        >
          <p
            className="text-[10px] 2xl:text-xs mb-1"
            style={{ color: remaining > 0 ? "#d97706" : "#059669" }}
          >
            {remaining > 0 ? "Remaining" : "Change"}
          </p>
          <p
            className="font-bold text-[9px] md:text-xs 2xl:text-sm"
            style={{ color: remaining > 0 ? "#d97706" : "#059669" }}
          >
            {remaining > 0 ? formatPeso(remaining) : formatPeso(change)}
          </p>
        </div>
      </div>
      {!canComplete ? (
        <div className="flex flex-row 2xl:flex-col flex-1 ">
          <div className="flex-1">
            <BigCard isRounded={false} title="Current Payments">
              {selectedPaymentMethod && selectedPaymentMethod.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPaymentMethod.map((payment, index) => {
                    const method = paymentMethods?.find(
                      (m) => m.payMetId === payment.payMetId,
                    );
                    const details = getPaymentIcon(method?.payMetName || "");
                    const Icon = details.icon || Banknote;
                    return (
                      <div
                        className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                        key={index}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${details.color} text-white`}
                          >
                            <Icon className="w-2 h-2 2xl:w-4 2xl:h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] 2xl:text-sm  font-medium text-slate-800">
                              {method?.payMetName}
                            </span>
                            {payment.paymentReference && (
                              <p className="text-[9px]  2xl:text-xs text-slate-500">
                                {payment.paymentReference}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className=" text-[9px] 2xl:text-sm   font-semibold text-slate-800">
                            {formatPeso(payment.salesPaymentAmount)}
                          </span>
                          <IconButton
                            bg="red"
                            icon={<X className="h-4 w-4" />}
                            label="Remove"
                            onClick={() => {
                              removePayment(index);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </BigCard>
          </div>
          <div className="flex-1">
            <BigCard isRounded={false} title="Add Payments">
              <div className="flex flex-col divide-gray-200 overflow-auto p-1  2xl:p-3 gap-3 h-full">
                <div className="grid grid-cols-4 gap-3">
                  {paymentMethods?.map((payment) => {
                    const { icon, color } = getPaymentIcon(payment.payMetName);
                    const Icon = icon || Banknote;
                    return (
                      <button
                        key={payment.payMetId}
                        onClick={() =>
                          setSelectedMethod((prev) => {
                            if (!prev) {
                              return {
                                salesId: 0,
                                payMetId: payment.payMetId,
                                salesPaymentAmount: 0,
                                paymentReference: "",
                                salesPaymentStatus: SalesPaymentStatus.PENDING,
                              };
                            }

                            return {
                              ...prev,
                              payMetId: payment.payMetId,
                            };
                          })
                        }
                        className={`flex flex-col items-center justify-center p-1 2xl:p-4 rounded-xl border-2 transition-all ${
                          selectedMethod?.payMetId === payment.payMetId
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${color} text-white mb-2`}
                        >
                          <Icon className="w-3 h-3 2xl:w-5 2xl:h-5" />
                        </div>
                        <span className="text-[9px] 2xl:text-sm font-medium text-slate-700">
                          {payment.payMetName}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa}
                      color="secondary"
                      size="sm"
                      onClick={() => handleQuickAmount(qa)}
                      className="flex-1"
                      label={formatPeso(qa)}
                    ></Button>
                  ))}
                  <Button
                    color="warning"
                    size="sm"
                    onClick={() => handleQuickAmount(remaining)}
                    className="flex-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    label={`${formatPeso(remaining)}`}
                  ></Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    leadingIcon={<PhilippinePeso className="w-4 h-4" />}
                    label={""}
                    sizes={"md"}
                    type="number"
                    name="salesPaymentAmount"
                    value={Number(selectedMethod?.salesPaymentAmount) || ""}
                    onChange={handleChangeSelectedPayment}
                  />
                  {findPaymentMethod?.payMetHasRef === 1 && (
                    <Input
                      label={""}
                      placeholder="Reference (optional)"
                      value={selectedMethod?.paymentReference}
                      name="paymentReference"
                      onChange={handleChangeSelectedPayment}
                    />
                  )}
                </div>

                <div className="mt-auto">
                  <Button
                    label="Add Payment"
                    size={"sm"}
                    className="w-full"
                    onClick={handleAddPayment}
                    icon={Plus}
                    disabled={
                      selectedMethod?.payMetId === null ||
                      selectedMethod?.payMetId === 0 ||
                      Number(selectedMethod?.salesPaymentAmount) === 0
                    }
                  />
                </div>
              </div>
            </BigCard>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-gray-600 font-semibold text-xs xl:text-sm">
              Applied Payments
            </label>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {selectedPaymentMethod &&
                selectedPaymentMethod.length &&
                selectedPaymentMethod.map((payment, index) => {
                  const method = paymentMethods?.find(
                    (m) => m.payMetId === payment.payMetId,
                  );
                  const details = getPaymentIcon(method?.payMetName || "");
                  const Icon = details.icon || Banknote;
                  return (
                    <div
                      className="flex items-center justify-between bg-slate-50 rounded-lg p-3 shadow"
                      key={index}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${details.color} text-white`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-[10px] 2xl:text-sm  text-slate-800">
                            {method?.payMetName}
                          </span>
                          {payment.paymentReference && (
                            <p className="text-xs text-slate-500">
                              {payment.paymentReference}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[9px] 2xl:text-sm  text-slate-800">
                          {formatPeso(payment.salesPaymentAmount)}
                        </span>
                        <IconButton
                          bg="red"
                          icon={<X className="h-4 w-4" />}
                          label="Remove"
                          onClick={() => {
                            removePayment(index);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-5">
            <label className="text-gray-600 font-semibold text-xs xl:text-sm">
              Add Order Remarks
            </label>
            <Textarea
              label={""}
              sizes="sm"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              name="remarks"
            />
          </div>
          <div className="mt-auto">
            <Button
              label={
                change
                  ? `Complete Sale(Change: ${formatPeso(change)})`
                  : `Complete Sale`
              }
              size={"md"}
              className="w-full"
              onClick={() => {
                handleCompleteSale(remarks);
              }}
              icon={Check}
              disabled={!canComplete}
              loading={isConfirming}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckOutModal;
